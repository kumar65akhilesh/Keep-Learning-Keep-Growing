/**
 * Expo Config Plugin — Handwriting OCR Native Module
 *
 * Injects:
 *   • Android: Kotlin native module for image segmentation (grayscale → adaptive
 *     threshold → connected-component labelling → 28×28 EMNIST crops)
 *   • iOS: Swift native module with equivalent segmentation pipeline
 *
 * The JS layer receives 28×28 pixel arrays and runs them through the
 * existing EMNIST TFLite model, keeping this approach fully offline and
 * isolated from the other OCR tiles.
 *
 * This plugin runs during `npx expo prebuild` so the native code
 * is regenerated every time, surviving `--clean` rebuilds.
 */

const { withMainApplication, withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ─── Android: Kotlin Native Module (Image Segmentation) ─────────

const HANDWRITING_MODULE_KT = `package com.letterlens.app

import com.facebook.react.bridge.*
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.FileOutputStream
import java.io.FileWriter
import java.util.LinkedList

class HandwritingOcrModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "HandwritingOcrModule"

    companion object {
        private const val TAG = "ScanOCR"
        private const val GRID = 28
        private const val INNER = 20            // centred content area
        // Phase 4 (structure-preserving tuning):
        //   - R=2 morph close: bridges pencil gaps without merging separate arms (F/E/P).
        //   - THRESH_OFFSET=5 gives clean binarization on low-contrast paper.
        //   - Smaller adaptive window for local context.
        private const val MAX_WORK_W = 1280
        private const val THRESH_OFFSET = 5     // 5 works well for A; 3 was too permissive
        private const val WIN_DIVISOR = 25      // ~50px window
    }

    // Single active log file path for the current scan (debug builds only)
    @Volatile private var currentLogFile: File? = null
    private val logLock = Any()

    private fun logDir(): File {
        val ext = reactApplicationContext.getExternalFilesDir(null)
        return ext ?: reactApplicationContext.filesDir
    }

    private fun appendLogLine(line: String) {
        if (!BuildConfig.DEBUG) return
        val f = currentLogFile ?: return
        try {
            synchronized(logLock) { FileWriter(f, true).use { it.append(line).append('\\n') } }
        } catch (e: Exception) { Log.w(TAG, "log append failed: \${e.message}") }
    }

    @ReactMethod
    fun appendLog(line: String, promise: Promise) {
        appendLogLine(line)
        promise.resolve(null)
    }

    @ReactMethod
    fun recognizeHandwriting(imageUri: String, promise: Promise) {
        Thread {
            try {
                val t0 = System.currentTimeMillis()

                // Open per-scan log file (debug only). Truncates each scan.
                if (BuildConfig.DEBUG) {
                    val f = File(logDir(), "scanocr_\${t0}.log")
                    try { f.writeText("") } catch (_: Exception) {}
                    currentLogFile = f
                    // Also maintain a stable "latest" symlink-like copy by writing path marker
                    try { File(logDir(), "scanocr_latest.txt").writeText(f.absolutePath) } catch (_: Exception) {}
                }

                fun lg(m: String) { Log.d(TAG, m); appendLogLine(m) }
                fun lw(m: String) { Log.w(TAG, m); appendLogLine("W " + m) }

                lg("── recognizeHandwriting START uri=$imageUri")
                val uri = Uri.parse(imageUri)
                val input = reactApplicationContext.contentResolver.openInputStream(uri)
                    ?: return@Thread promise.reject("SEG_ERR", "Cannot open image")
                val decoded = BitmapFactory.decodeStream(input)
                input.close()
                if (decoded == null) return@Thread promise.reject("SEG_ERR", "Cannot decode image")

                // ── EXIF orientation correction ───────────────────────
                val original: Bitmap = try {
                    val exifStream = reactApplicationContext.contentResolver.openInputStream(uri)
                    val exif = if (exifStream != null) ExifInterface(exifStream) else null
                    exifStream?.close()
                    val orientation = exif?.getAttributeInt(
                        ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL
                    ) ?: ExifInterface.ORIENTATION_NORMAL
                    lg("EXIF orientation: \$orientation")
                    val matrix = Matrix()
                    when (orientation) {
                        ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                        ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                        ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                        ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
                        ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
                        ExifInterface.ORIENTATION_TRANSPOSE -> { matrix.postRotate(90f); matrix.postScale(-1f, 1f) }
                        ExifInterface.ORIENTATION_TRANSVERSE -> { matrix.postRotate(270f); matrix.postScale(-1f, 1f) }
                    }
                    val needsTransform = !matrix.isIdentity
                    if (needsTransform) {
                        val rotated = Bitmap.createBitmap(decoded, 0, 0, decoded.width, decoded.height, matrix, true)
                        if (rotated !== decoded) decoded.recycle()
                        lg("EXIF transform applied → \${rotated.width}x\${rotated.height}")
                        rotated
                    } else {
                        decoded
                    }
                } catch (e: Exception) {
                    lw("EXIF read failed: \${e.message}, using original")
                    decoded
                }
                lg("Original image: \${original.width}x\${original.height}")

                // ── Down-scale ────────────────────────────────────────
                val scale = if (original.width > MAX_WORK_W)
                    MAX_WORK_W.toFloat() / original.width else 1f
                val w = (original.width * scale).toInt()
                val h = (original.height * scale).toInt()
                val bmp = Bitmap.createScaledBitmap(original, w, h, true)
                if (bmp !== original) original.recycle()
                lg("Working size: \${w}x\${h} (scale=\${scale})")

                // ── Grayscale ─────────────────────────────────────────
                val gray = IntArray(w * h)
                var grayMin = 255; var grayMax = 0; var graySum = 0L
                for (y in 0 until h) {
                    for (x in 0 until w) {
                        val px = bmp.getPixel(x, y)
                        val g = ((0.299 * Color.red(px)
                                + 0.587 * Color.green(px)
                                + 0.114 * Color.blue(px))).toInt()
                        gray[y * w + x] = g
                        if (g < grayMin) grayMin = g
                        if (g > grayMax) grayMax = g
                        graySum += g
                    }
                }
                bmp.recycle()
                lg("Gray stats: min=\$grayMin max=\$grayMax mean=\${graySum / (w*h)}")

                // ── Integral image for adaptive threshold ─────────────
                val integral = LongArray((w + 1) * (h + 1))
                for (y in 0 until h) {
                    var rowSum = 0L
                    for (x in 0 until w) {
                        rowSum += gray[y * w + x]
                        integral[(y + 1) * (w + 1) + (x + 1)] =
                            rowSum + integral[y * (w + 1) + (x + 1)]
                    }
                }

                val winHalf = maxOf(w, h) / WIN_DIVISOR
                lg("Adaptive thresh: winHalf=\$winHalf offset=\$THRESH_OFFSET")
                val binary = BooleanArray(w * h)
                var inkCount = 0
                for (y in 0 until h) {
                    for (x in 0 until w) {
                        val x1 = maxOf(0, x - winHalf)
                        val y1 = maxOf(0, y - winHalf)
                        val x2 = minOf(w - 1, x + winHalf)
                        val y2 = minOf(h - 1, y + winHalf)
                        val cnt = (x2 - x1 + 1) * (y2 - y1 + 1)
                        val sum = integral[(y2 + 1) * (w + 1) + (x2 + 1)] -
                                  integral[y1 * (w + 1) + (x2 + 1)] -
                                  integral[(y2 + 1) * (w + 1) + x1] +
                                  integral[y1 * (w + 1) + x1]
                        val isInk = gray[y * w + x] < (sum / cnt - THRESH_OFFSET)
                        binary[y * w + x] = isInk
                        if (isInk) inkCount++
                    }
                }
                lg("Binary: inkPixels=\$inkCount (\${"%.2f".format(100.0 * inkCount / (w*h))}%)")

                // ── Auto-polarity detection (chalkboard/light-on-dark) ──
                val totalPx = w * h
                val inverted = inkCount > totalPx * 0.40
                if (inverted) {
                    lg("Polarity: INVERTED (ink=\${"%.1f".format(100.0 * inkCount / totalPx)}%% > 40%%) — flipping binary")
                    for (i in binary.indices) binary[i] = !binary[i]
                    inkCount = binary.count { it }
                    lg("After invert: inkPixels=\$inkCount (\${"%.2f".format(100.0 * inkCount / totalPx)}%%)")
                } else {
                    lg("Polarity: normal (dark-on-light)")
                }

                // ── Ruled-line removal (morphological opening with wide horizontal kernel) ──
                // Detects horizontal lines spanning ≥80% of image width using
                // morphological opening (erode then dilate with a 1×kernelW kernel).
                // Only applies if >5 distinct lines found (i.e., ruled/notebook paper).
                run {
                    val kernelW = (w * 0.8).toInt()
                    // Horizontal erosion: pixel survives only if entire kernel is ink
                    val eroded = BooleanArray(w * h)
                    for (y in 0 until h) {
                        var runLen = 0
                        for (x in 0 until w) {
                            if (binary[y * w + x]) { runLen++ } else { runLen = 0 }
                            if (runLen >= kernelW) {
                                // Mark the full kernel span as eroded
                                for (dx in 0 until kernelW) eroded[y * w + (x - dx)] = true
                            }
                        }
                    }
                    // Horizontal dilation: expand eroded result by kernelW/2 in each direction
                    val lineMask = BooleanArray(w * h)
                    val halfK = kernelW / 2
                    for (y in 0 until h) {
                        for (x in 0 until w) {
                            if (eroded[y * w + x]) {
                                for (dx in -halfK..halfK) {
                                    val nx = x + dx
                                    if (nx in 0 until w) lineMask[y * w + nx] = true
                                }
                            }
                        }
                    }
                    // Count distinct horizontal lines (group contiguous rows with ≥10px gap)
                    val lineRows = (0 until h).filter { y -> (0 until w).any { x -> lineMask[y * w + x] } }
                    var lineCount = 0
                    var prevRow = -20
                    for (row in lineRows) {
                        if (row - prevRow > 10) lineCount++
                        prevRow = row
                    }
                    lg("Line removal: detected \$lineCount ruled lines (kernelW=\$kernelW)")
                    if (lineCount > 5) {
                        var removed = 0
                        for (i in binary.indices) {
                            if (lineMask[i] && binary[i]) { binary[i] = false; removed++ }
                        }
                        lg("Line removal: subtracted \$removed ink pixels from \$lineCount lines")
                    } else {
                        lg("Line removal: skipped (\$lineCount ≤ 5 lines, not ruled paper)")
                    }
                }

                // ── Morphological close (dilate → erode) bridges ≤ 2px stroke gaps ──
                // R=2 reconnects broken pencil strokes while preserving separate arms (F/E/P)
                // R=3 was too aggressive (merged F's arms into a blob)
                // R=1 was too weak (left strokes fragmented → only largest fragment kept)
                run {
                    val R = 2
                    val dilated = BooleanArray(w * h)
                    for (y in 0 until h) for (x in 0 until w) {
                        if (binary[y * w + x]) {
                            for (dy in -R..R) for (dx in -R..R) {
                                val nx = x + dx; val ny = y + dy
                                if (nx in 0 until w && ny in 0 until h) dilated[ny * w + nx] = true
                            }
                        }
                    }
                    var closed = 0
                    for (y in 0 until h) for (x in 0 until w) {
                        if (!dilated[y * w + x]) { binary[y * w + x] = false; continue }
                        var ok = true
                        loop@ for (dy in -R..R) for (dx in -R..R) {
                            val nx = x + dx; val ny = y + dy
                            if (nx !in 0 until w || ny !in 0 until h) continue
                            if (!dilated[ny * w + nx]) { ok = false; break@loop }
                        }
                        binary[y * w + x] = ok
                        if (ok) closed++
                    }
                    lg("After morph close (R=3): inkPixels=\$closed")
                }

                // ── Connected-component labelling (8-connected BFS) ──
                val labels = IntArray(w * h)
                var nextLabel = 1
                val bounds = mutableMapOf<Int, IntArray>() // label→[minX,minY,maxX,maxY,pixCount]

                for (y in 0 until h) {
                    for (x in 0 until w) {
                        val idx = y * w + x
                        if (!binary[idx] || labels[idx] != 0) continue
                        val lbl = nextLabel++
                        val b = intArrayOf(x, y, x, y, 0)
                        val q = LinkedList<Int>()
                        q.add(idx); labels[idx] = lbl
                        while (q.isNotEmpty()) {
                            val cur = q.poll()
                            val cx = cur % w; val cy = cur / w
                            b[0] = minOf(b[0], cx); b[1] = minOf(b[1], cy)
                            b[2] = maxOf(b[2], cx); b[3] = maxOf(b[3], cy)
                            b[4]++
                            for (dy in -1..1) for (dx in -1..1) {
                                if (dx == 0 && dy == 0) continue
                                val nx = cx + dx; val ny = cy + dy
                                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
                                val ni = ny * w + nx
                                if (binary[ni] && labels[ni] == 0) {
                                    labels[ni] = lbl; q.add(ni)
                                }
                            }
                        }
                        bounds[lbl] = b
                    }
                }
                lg("Raw components: \${bounds.size}")
                if (bounds.size <= 50) {
                    for ((lbl, b) in bounds) {
                        lg("  raw lbl=\$lbl x=\${b[0]} y=\${b[1]} w=\${b[2]-b[0]+1} h=\${b[3]-b[1]+1} px=\${b[4]}")
                    }
                } else {
                    lg("  (skipping per-component dump; too many)")
                }

                // ── Filter noise (Phase 3 — pencil-friendly) ─────────────
                val minDim = maxOf(w, h) * 0.04
                val maxDim = maxOf(w, h) * 0.85
                val minPx  = (maxOf(w, h) * 0.20).toInt().coerceAtLeast(50)
                val edgeMargin = (maxOf(w, h) * 0.05).toInt()  // 5% edge margin
                lg("Filter: minDim=\${"%.1f".format(minDim)} maxDim=\${"%.1f".format(maxDim)} minPx=\$minPx aspect=1/5..5 edgeMargin=\$edgeMargin")

                val valid = mutableMapOf<Int, IntArray>()
                for ((lbl, b) in bounds) {
                    val bw = b[2] - b[0]; val bh = b[3] - b[1]
                    val dim = maxOf(bw, bh)
                    val aspect = if (bh == 0) 999.0 else bw.toDouble() / bh
                    val touchesEdge = b[0] < edgeMargin || b[1] < edgeMargin || b[2] > w - edgeMargin || b[3] > h - edgeMargin
                    val reason = when {
                        bw < 2 || bh < 2 -> "tiny_bw_bh"
                        dim < minDim -> "too_small_dim(\$dim<\${"%.0f".format(minDim)})"
                        dim > maxDim -> "too_large_dim(\$dim>\${"%.0f".format(maxDim)})"
                        b[4] < minPx -> "too_few_px(\${b[4]}<\$minPx)"
                        aspect > 5.0 || aspect < 0.2 -> "bad_aspect(\${"%.2f".format(aspect)})"
                        touchesEdge -> "touches_edge(x=\${b[0]},y=\${b[1]},x2=\${b[2]},y2=\${b[3]})"
                        else -> null
                    }
                    if (reason == null) {
                        valid[lbl] = b
                    } else if (bounds.size <= 50) {
                        lg("  REJECT lbl=\$lbl reason=\$reason bw=\$bw bh=\$bh px=\${b[4]}")
                    }
                }
                lg("After filter: \${valid.size} components")

                // ── Phase 2: Merge nearby components (one char per group) ──
                val keys = valid.keys.toList()
                val heights = keys.map { valid[it]!![3] - valid[it]!![1] + 1 }.sorted()
                val medH = if (heights.isEmpty()) 0 else heights[heights.size / 2]
                val gapMaxX = medH * 0.4
                val gapMaxY = medH * 1.5
                lg("Merge: medH=\$medH gapMaxX=\${"%.1f".format(gapMaxX)} gapMaxY=\${"%.1f".format(gapMaxY)}")

                val parent = IntArray(keys.size) { it }
                fun find(i: Int): Int { var r = i; while (parent[r] != r) r = parent[r]; var c = i; while (parent[c] != c) { val n = parent[c]; parent[c] = r; c = n }; return r }
                fun union(a: Int, b: Int) { val ra = find(a); val rb = find(b); if (ra != rb) parent[ra] = rb }

                for (i in keys.indices) for (j in i + 1 until keys.size) {
                    val a = valid[keys[i]]!!; val b = valid[keys[j]]!!
                    val ax1 = a[0]; val ax2 = a[2]; val ay1 = a[1]; val ay2 = a[3]
                    val bx1 = b[0]; val bx2 = b[2]; val by1 = b[1]; val by2 = b[3]
                    val dx = maxOf(0, maxOf(ax1, bx1) - minOf(ax2, bx2))
                    val dy = maxOf(0, maxOf(ay1, by1) - minOf(ay2, by2))
                    if (dx <= gapMaxX && dy <= gapMaxY) {
                        lg("  MERGE lbl=\${keys[i]} + lbl=\${keys[j]} dx=\$dx dy=\$dy")
                        union(i, j)
                    }
                }

                data class Group(var x1: Int, var y1: Int, var x2: Int, var y2: Int, val members: MutableList<Int>)
                val groups = mutableMapOf<Int, Group>()
                for (i in keys.indices) {
                    val root = find(i)
                    val b = valid[keys[i]]!!
                    val g = groups[root]
                    if (g == null) groups[root] = Group(b[0], b[1], b[2], b[3], mutableListOf(keys[i]))
                    else {
                        g.x1 = minOf(g.x1, b[0]); g.y1 = minOf(g.y1, b[1])
                        g.x2 = maxOf(g.x2, b[2]); g.y2 = maxOf(g.y2, b[3])
                        g.members.add(keys[i])
                    }
                }
                lg("After merge: \${groups.size} character groups")

                // Keep only the group with most ink pixels — real characters are denser than edge noise
                val sortedGroups = if (groups.size > 1) {
                    val best = groups.values.maxByOrNull { g ->
                        // Count actual ink pixels in the group's members
                        g.members.sumOf { lbl -> valid[lbl]?.get(4) ?: 0 }
                    }!!
                    lg("Keeping densest group: \${best.x2-best.x1+1}x\${best.y2-best.y1+1} ink=\${best.members.sumOf { lbl -> valid[lbl]?.get(4) ?: 0 }} (dropped \${groups.size - 1} others)")
                    listOf(best)
                } else {
                    groups.values.sortedBy { it.x1 }
                }
                for ((idx, g) in sortedGroups.withIndex()) {
                    lg("  group#\$idx x=\${g.x1} y=\${g.y1} w=\${g.x2-g.x1+1} h=\${g.y2-g.y1+1} members=\${g.members}")
                }

                // ── Optional debug overlay dump (DEBUG builds only) ──
                var debugOverlayUri: String? = null
                if (BuildConfig.DEBUG) {
                    try {
                        val outDir = logDir()
                        val overlay = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                        for (y in 0 until h) for (x in 0 until w) {
                            overlay.setPixel(x, y, if (binary[y * w + x]) Color.BLACK else Color.WHITE)
                        }
                        for (g in sortedGroups) {
                            for (x in g.x1..g.x2) {
                                if (g.y1 in 0 until h) overlay.setPixel(x, g.y1, Color.RED)
                                if (g.y2 in 0 until h) overlay.setPixel(x, g.y2, Color.RED)
                            }
                            for (y in g.y1..g.y2) {
                                if (g.x1 in 0 until w) overlay.setPixel(g.x1, y, Color.RED)
                                if (g.x2 in 0 until w) overlay.setPixel(g.x2, y, Color.RED)
                            }
                        }
                        val debugFile = File(outDir, "scanocr_debug_\${t0}.png")
                        FileOutputStream(debugFile).use { overlay.compress(Bitmap.CompressFormat.PNG, 90, it) }
                        overlay.recycle()
                        debugOverlayUri = "file://\${debugFile.absolutePath}"
                        lg("Debug overlay saved: \${debugFile.absolutePath}")
                    } catch (e: Exception) {
                        lw("Failed to write debug overlay: \${e.message}")
                    }
                }

                // ── Build 28×28 EMNIST grid per group ────────────────
                val results = JSONArray()
                for (g in sortedGroups) {
                    val bx = g.x1; val by = g.y1
                    val bw = g.x2 - bx + 1; val bh = g.y2 - by + 1
                    val maxRange = maxOf(bw, bh).toFloat()
                    val s = INNER / maxRange
                    val ox = (GRID - bw * s) / 2f
                    val oy = (GRID - bh * s) / 2f

                    // Use binary mask for grid — this matches EMNIST format:
                    // white strokes (1.0) on black background (0.0).
                    // The binary mask is already clean from adaptive thresholding.
                    var inkPx = 0; var totalPx = 0
                    val grid = FloatArray(GRID * GRID)
                    for (py in g.y1..g.y2) for (px in g.x1..g.x2) {
                        totalPx++
                        if (!binary[py * w + px]) continue  // only ink pixels
                        inkPx++
                        val gx = ((px - bx) * s + ox).toInt()
                        val gy = ((py - by) * s + oy).toInt()
                        if (gx in 0 until GRID && gy in 0 until GRID) {
                            val gi = gy * GRID + gx
                            grid[gi] = 1.0f
                        }
                    }
                    lg("  grid: inkPx=\$inkPx/\$totalPx (\${"%.1f".format(100.0 * inkPx / maxOf(1, totalPx))}%)")

                    // Light anti-alias pass: soften edges to match EMNIST style
                    val smooth = grid.copyOf()
                    for (gy in 0 until GRID) for (gx in 0 until GRID) {
                        if (grid[gy * GRID + gx] > 0f) continue  // skip filled pixels
                        var neighbors = 0
                        for (dy in -1..1) for (dx in -1..1) {
                            if (dx == 0 && dy == 0) continue
                            val nx = gx + dx; val ny = gy + dy
                            if (nx in 0 until GRID && ny in 0 until GRID && grid[ny * GRID + nx] > 0f)
                                neighbors++
                        }
                        if (neighbors >= 2) smooth[gy * GRID + gx] = 0.3f
                    }

                    val pxArr = JSONArray()
                    for (v in smooth) pxArr.put(v.toDouble())

                    val bbox = JSONObject()
                    bbox.put("x", bx.toDouble() / w)
                    bbox.put("y", by.toDouble() / h)
                    bbox.put("width", bw.toDouble() / w)
                    bbox.put("height", bh.toDouble() / h)

                    val obj = JSONObject()
                    obj.put("pixels", pxArr)
                    obj.put("boundingBox", bbox)
                    results.put(obj)
                }

                val resp = JSONObject()
                resp.put("characters", results)
                resp.put("count", results.length())
                if (debugOverlayUri != null) resp.put("debugOverlayUri", debugOverlayUri)
                currentLogFile?.let { resp.put("debugLogUri", "file://\${it.absolutePath}") }
                val dt = System.currentTimeMillis() - t0
                lg("── recognizeHandwriting END count=\${results.length()} took=\${dt}ms")

                promise.resolve(resp.toString())
            } catch (e: Exception) {
                Log.e(TAG, "Segmentation failed", e)
                appendLogLine("E Segmentation failed: \${e.message}")
                promise.reject("SEG_ERR", e.message, e)
            }
        }.start()
    }
}
`;

const HANDWRITING_PACKAGE_KT = `package com.letterlens.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class HandwritingOcrPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(HandwritingOcrModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;

// ─── iOS: Swift Native Module (Image Segmentation) ──────────────

const HANDWRITING_MODULE_SWIFT = `import Foundation
import UIKit
import os

@objc(HandwritingOcrModule)
class HandwritingOcrModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  private let GRID = 28
  private let INNER: Float = 20
  // Phase 3 (pencil-on-paper tuning) — see Android module for rationale.
  private let MAX_WORK: CGFloat = 1280
  private let THRESH_OFFSET: Int64 = 5
  private let WIN_DIVISOR = 25
  private let log = OSLog(subsystem: "com.letterlens.app", category: "ScanOCR")

  // Active per-scan log file path (DEBUG only)
  private var currentLogPath: URL?
  private let logQueue = DispatchQueue(label: "com.letterlens.scanocr.log")

  private func logsDir() -> URL {
    return FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
  }

  private func appendLogLine(_ line: String) {
    #if DEBUG
    guard let path = currentLogPath else { return }
    logQueue.async {
      if let data = (line + "\\n").data(using: .utf8) {
        if let handle = try? FileHandle(forWritingTo: path) {
          handle.seekToEndOfFile()
          handle.write(data)
          try? handle.close()
        } else {
          try? data.write(to: path)
        }
      }
    }
    #endif
  }

  @objc
  func appendLog(_ line: String,
                 resolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    appendLogLine(line)
    resolve(nil)
  }

  @objc
  func recognizeHandwriting(_ imageUri: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async { [self] in
      let t0 = Date()
      let t0ms = Int(t0.timeIntervalSince1970 * 1000)

      #if DEBUG
      let logPath = logsDir().appendingPathComponent("scanocr_\\(t0ms).log")
      try? "".write(to: logPath, atomically: true, encoding: .utf8)
      currentLogPath = logPath
      try? logPath.absoluteString.write(to: logsDir().appendingPathComponent("scanocr_latest.txt"), atomically: true, encoding: .utf8)
      #endif

      func dbg(_ m: String) {
        os_log("%{public}@", log: log, type: .debug, m)
        appendLogLine(m)
      }
      func dbgW(_ m: String) {
        os_log("%{public}@", log: log, type: .info, m)
        appendLogLine("W " + m)
      }

      dbg("── recognizeHandwriting START uri=\\(imageUri)")
      guard let url = URL(string: imageUri),
            let data = try? Data(contentsOf: url),
            let loadedImage = UIImage(data: data) else {
        reject("SEG_ERR", "Cannot load image", nil)
        return
      }

      // ── EXIF orientation correction ────────────────────────────
      let original: UIImage
      if loadedImage.imageOrientation != .up, let cgImg = loadedImage.cgImage {
        let orientVal = loadedImage.imageOrientation.rawValue
        dbg("EXIF orientation: \\(orientVal) — correcting")
        UIGraphicsBeginImageContextWithOptions(loadedImage.size, false, loadedImage.scale)
        loadedImage.draw(in: CGRect(origin: .zero, size: loadedImage.size))
        original = UIGraphicsGetImageFromCurrentImageContext() ?? loadedImage
        UIGraphicsEndImageContext()
        dbg("Rotated → \\(Int(original.size.width))x\\(Int(original.size.height))")
      } else {
        dbg("EXIF orientation: up (no correction needed)")
        original = loadedImage
      }
      guard let cgOrig = original.cgImage else {
        reject("SEG_ERR", "Cannot get CGImage", nil)
        return
      }
      dbg("Original image: \\(cgOrig.width)x\\(cgOrig.height)")

      // ── Downscale ──────────────────────────────────────────────
      let origW = cgOrig.width
      let origH = cgOrig.height
      let scale = origW > Int(MAX_WORK) ? MAX_WORK / CGFloat(origW) : 1.0
      let w = Int(CGFloat(origW) * scale)
      let h = Int(CGFloat(origH) * scale)
      dbg("Working size: \\(w)x\\(h) scale=\\(String(format: \"%.3f\", Double(scale)))")

      let colorSpace = CGColorSpaceCreateDeviceGray()
      guard let ctx = CGContext(data: nil, width: w, height: h,
                                bitsPerComponent: 8, bytesPerRow: w,
                                space: colorSpace,
                                bitmapInfo: CGImageAlphaInfo.none.rawValue) else {
        reject("SEG_ERR", "Cannot create CGContext", nil); return
      }
      ctx.draw(cgOrig, in: CGRect(x: 0, y: 0, width: w, height: h))
      guard let grayPtr = ctx.data?.assumingMemoryBound(to: UInt8.self) else {
        reject("SEG_ERR", "Cannot access pixel data", nil); return
      }

      let gray = Array(UnsafeBufferPointer(start: grayPtr, count: w * h))

      var gmin: UInt8 = 255; var gmax: UInt8 = 0; var gsum: Int64 = 0
      for v in gray { if v < gmin { gmin = v }; if v > gmax { gmax = v }; gsum += Int64(v) }
      dbg("Gray stats: min=\\(gmin) max=\\(gmax) mean=\\(gsum / Int64(w * h))")

      // ── Integral image for adaptive threshold ──────────────────
      var integral = [Int64](repeating: 0, count: (w + 1) * (h + 1))
      for y in 0..<h {
        var rowSum: Int64 = 0
        for x in 0..<w {
          rowSum += Int64(gray[y * w + x])
          integral[(y + 1) * (w + 1) + (x + 1)] = rowSum + integral[y * (w + 1) + (x + 1)]
        }
      }

      let winHalf = max(w, h) / WIN_DIVISOR
      dbg("Adaptive thresh: winHalf=\\(winHalf) offset=\\(THRESH_OFFSET)")
      var binary = [Bool](repeating: false, count: w * h)
      var inkCount = 0
      for y in 0..<h {
        for x in 0..<w {
          let x1 = max(0, x - winHalf)
          let y1 = max(0, y - winHalf)
          let x2 = min(w - 1, x + winHalf)
          let y2 = min(h - 1, y + winHalf)
          let cnt = (x2 - x1 + 1) * (y2 - y1 + 1)
          let sum = integral[(y2 + 1) * (w + 1) + (x2 + 1)]
                  - integral[y1 * (w + 1) + (x2 + 1)]
                  - integral[(y2 + 1) * (w + 1) + x1]
                  + integral[y1 * (w + 1) + x1]
          let isInk = Int64(gray[y * w + x]) < (sum / Int64(cnt) - THRESH_OFFSET)
          binary[y * w + x] = isInk
          if isInk { inkCount += 1 }
        }
      }
      dbg("Binary: inkPixels=\\(inkCount) (\\(String(format: \"%.2f\", 100.0 * Double(inkCount) / Double(w * h)))%)")

      // ── Auto-polarity detection (chalkboard/light-on-dark) ─────
      let totalPx = w * h
      let inverted = inkCount > Int(Double(totalPx) * 0.40)
      if inverted {
        dbg("Polarity: INVERTED (ink=\\(String(format: \"%.1f\", 100.0 * Double(inkCount) / Double(totalPx)))% > 40%) — flipping binary")
        for i in 0..<binary.count { binary[i] = !binary[i] }
        inkCount = binary.filter { $0 }.count
        dbg("After invert: inkPixels=\\(inkCount) (\\(String(format: \"%.2f\", 100.0 * Double(inkCount) / Double(totalPx)))%)")
      } else {
        dbg("Polarity: normal (dark-on-light)")
      }

      // ── Ruled-line removal (morphological opening with wide horizontal kernel) ──
      // Detects horizontal lines spanning ≥80% of image width.
      // Only applies if >5 distinct lines found (ruled/notebook paper).
      do {
        let kernelW = Int(Double(w) * 0.8)
        // Horizontal erosion: pixel survives only if full kernel span is ink
        var eroded = [Bool](repeating: false, count: w * h)
        for y in 0..<h {
          var runLen = 0
          for x in 0..<w {
            if binary[y * w + x] { runLen += 1 } else { runLen = 0 }
            if runLen >= kernelW {
              for dx in 0..<kernelW { eroded[y * w + (x - dx)] = true }
            }
          }
        }
        // Horizontal dilation: expand by kernelW/2 in each direction
        var lineMask = [Bool](repeating: false, count: w * h)
        let halfK = kernelW / 2
        for y in 0..<h {
          for x in 0..<w {
            if eroded[y * w + x] {
              for dx in -halfK...halfK {
                let nx = x + dx
                if nx >= 0 && nx < w { lineMask[y * w + nx] = true }
              }
            }
          }
        }
        // Count distinct horizontal lines (group rows with >10px gap)
        var lineCount = 0
        var prevRow = -20
        for y in 0..<h {
          let hasLine = (0..<w).contains { x in lineMask[y * w + x] }
          if hasLine {
            if y - prevRow > 10 { lineCount += 1 }
            prevRow = y
          }
        }
        dbg("Line removal: detected \\(lineCount) ruled lines (kernelW=\\(kernelW))")
        if lineCount > 5 {
          var removed = 0
          for i in 0..<binary.count {
            if lineMask[i] && binary[i] { binary[i] = false; removed += 1 }
          }
          dbg("Line removal: subtracted \\(removed) ink pixels from \\(lineCount) lines")
        } else {
          dbg("Line removal: skipped (\\(lineCount) ≤ 5 lines, not ruled paper)")
        }
      }

      // ── Morphological close (dilate → erode) bridges ≤ 3px stroke gaps ──
      do {
        let R = 3
        var dilated = [Bool](repeating: false, count: w * h)
        for y in 0..<h { for x in 0..<w {
          if binary[y * w + x] {
            for dy in -R...R { for dx in -R...R {
              let nx = x + dx; let ny = y + dy
              if nx >= 0 && nx < w && ny >= 0 && ny < h { dilated[ny * w + nx] = true }
            }}
          }
        }}
        var closed = 0
        for y in 0..<h { for x in 0..<w {
          if !dilated[y * w + x] { binary[y * w + x] = false; continue }
          var ok = true
          outer: for dy in -R...R { for dx in -R...R {
            let nx = x + dx; let ny = y + dy
            if nx < 0 || nx >= w || ny < 0 || ny >= h { continue }
            if !dilated[ny * w + nx] { ok = false; break outer }
          }}
          binary[y * w + x] = ok
          if ok { closed += 1 }
        }}
        dbg("After morph close (R=3): inkPixels=\\(closed)")
      }

      // ── Connected-component labelling (8-connected BFS) ────────
      var labels = [Int](repeating: 0, count: w * h)
      var nextLabel = 1
      var bounds = [Int: [Int]]()

      for y in 0..<h {
        for x in 0..<w {
          let idx = y * w + x
          guard binary[idx] && labels[idx] == 0 else { continue }
          let lbl = nextLabel; nextLabel += 1
          var b = [x, y, x, y, 0]
          var queue = [idx]; labels[idx] = lbl
          var qi = 0
          while qi < queue.count {
            let cur = queue[qi]; qi += 1
            let cx = cur % w; let cy = cur / w
            b[0] = min(b[0], cx); b[1] = min(b[1], cy)
            b[2] = max(b[2], cx); b[3] = max(b[3], cy)
            b[4] += 1
            for dy in -1...1 { for dx in -1...1 {
              if dx == 0 && dy == 0 { continue }
              let nx = cx + dx; let ny = cy + dy
              guard nx >= 0 && nx < w && ny >= 0 && ny < h else { continue }
              let ni = ny * w + nx
              if binary[ni] && labels[ni] == 0 { labels[ni] = lbl; queue.append(ni) }
            }}
          }
          bounds[lbl] = b
        }
      }
      dbg("Raw components: \\(bounds.count)")
      if bounds.count <= 50 {
        for (lbl, b) in bounds {
          dbg("  raw lbl=\\(lbl) x=\\(b[0]) y=\\(b[1]) w=\\(b[2]-b[0]+1) h=\\(b[3]-b[1]+1) px=\\(b[4])")
        }
      }

      // ── Filter noise (Phase 3 — pencil-friendly) ───────────────────
      let minDim = Float(max(w, h)) * 0.04
      let maxDim = Float(max(w, h)) * 0.85
      let minPx  = max(Int(Float(max(w, h)) * 0.20), 50)
      let edgeMargin = Int(Float(max(w, h)) * 0.05)  // 5% edge margin
      dbg("Filter: minDim=\\(String(format: \"%.1f\", Double(minDim))) maxDim=\\(String(format: \"%.1f\", Double(maxDim))) minPx=\\(minPx) aspect=1/5..5 edgeMargin=\\(edgeMargin)")

      var valid = [Int: [Int]]()
      for (lbl, b) in bounds {
        let bw = b[2] - b[0]; let bh = b[3] - b[1]
        let dim = max(bw, bh)
        let aspect: Double = bh == 0 ? 999.0 : Double(bw) / Double(bh)
        let touchesEdge = b[0] < edgeMargin || b[1] < edgeMargin || b[2] > w - edgeMargin || b[3] > h - edgeMargin
        var reason: String? = nil
        if bw < 2 || bh < 2 { reason = "tiny_bw_bh" }
        else if Float(dim) < minDim { reason = "too_small_dim" }
        else if Float(dim) > maxDim { reason = "too_large_dim" }
        else if b[4] < minPx { reason = "too_few_px" }
        else if aspect > 5.0 || aspect < 0.2 { reason = "bad_aspect" }
        else if touchesEdge { reason = "touches_edge" }
        if reason == nil { valid[lbl] = b }
        else if bounds.count <= 50 {
          dbg("  REJECT lbl=\\(lbl) reason=\\(reason!) bw=\\(bw) bh=\\(bh) px=\\(b[4])")
        }
      }
      dbg("After filter: \\(valid.count) components")

      // ── Phase 2: Merge nearby components ───────────────────────
      let keys = Array(valid.keys)
      let heights = keys.map { valid[$0]![3] - valid[$0]![1] + 1 }.sorted()
      let medH = heights.isEmpty ? 0 : heights[heights.count / 2]
      let gapMaxX = Double(medH) * 0.4
      let gapMaxY = Double(medH) * 1.5
      dbg("Merge: medH=\\(medH) gapMaxX=\\(String(format: \"%.1f\", gapMaxX)) gapMaxY=\\(String(format: \"%.1f\", gapMaxY))")

      var parent = Array(0..<keys.count)
      func find(_ i: Int) -> Int { var r = i; while parent[r] != r { r = parent[r] }; var c = i; while parent[c] != c { let n = parent[c]; parent[c] = r; c = n }; return r }
      func union(_ a: Int, _ b: Int) { let ra = find(a); let rb = find(b); if ra != rb { parent[ra] = rb } }

      for i in 0..<keys.count { for j in (i+1)..<keys.count {
        let a = valid[keys[i]]!; let b = valid[keys[j]]!
        let dx = max(0, max(a[0], b[0]) - min(a[2], b[2]))
        let dy = max(0, max(a[1], b[1]) - min(a[3], b[3]))
        if Double(dx) <= gapMaxX && Double(dy) <= gapMaxY {
          dbg("  MERGE lbl=\\(keys[i]) + lbl=\\(keys[j]) dx=\\(dx) dy=\\(dy)")
          union(i, j)
        }
      }}

      var groups = [Int: (x1: Int, y1: Int, x2: Int, y2: Int, members: [Int])]()
      for i in 0..<keys.count {
        let root = find(i)
        let b = valid[keys[i]]!
        if var g = groups[root] {
          g.x1 = min(g.x1, b[0]); g.y1 = min(g.y1, b[1])
          g.x2 = max(g.x2, b[2]); g.y2 = max(g.y2, b[3])
          g.members.append(keys[i])
          groups[root] = g
        } else {
          groups[root] = (b[0], b[1], b[2], b[3], [keys[i]])
        }
      }
      dbg("After merge: \\(groups.count) character groups")

      // Keep only the group with most ink pixels — real characters are denser than edge noise
      let sortedGroups: [(x1: Int, y1: Int, x2: Int, y2: Int, members: [Int])]
      if groups.count > 1 {
        let best = groups.values.max(by: { a, b in
          let aInk = a.members.reduce(0) { $0 + (valid[$1]?[4] ?? 0) }
          let bInk = b.members.reduce(0) { $0 + (valid[$1]?[4] ?? 0) }
          return aInk < bInk
        })!
        let bestInk = best.members.reduce(0) { $0 + (valid[$1]?[4] ?? 0) }
        dbg("Keeping densest group: \\(best.x2-best.x1+1)x\\(best.y2-best.y1+1) ink=\\(bestInk) (dropped \\(groups.count - 1) others)")
        sortedGroups = [best]
      } else {
        sortedGroups = groups.values.sorted { $0.x1 < $1.x1 }
      }
      for (idx, g) in sortedGroups.enumerated() {
        dbg("  group#\\(idx) x=\\(g.x1) y=\\(g.y1) w=\\(g.x2-g.x1+1) h=\\(g.y2-g.y1+1) members=\\(g.members.count)")
      }

      // ── Optional debug overlay dump ────────────────────────────
      var debugOverlayUri: String? = nil
      #if DEBUG
      do {
        let overlayPath = logsDir().appendingPathComponent("scanocr_debug_\\(t0ms).png")
        let bytesPerRow = w * 4
        var pixels = [UInt8](repeating: 255, count: w * h * 4)
        for y in 0..<h { for x in 0..<w {
          let i = (y * w + x) * 4
          let v: UInt8 = binary[y * w + x] ? 0 : 255
          pixels[i] = v; pixels[i+1] = v; pixels[i+2] = v; pixels[i+3] = 255
        }}
        for g in sortedGroups {
          for x in g.x1...g.x2 {
            for yy in [g.y1, g.y2] where yy >= 0 && yy < h {
              let i = (yy * w + x) * 4
              pixels[i] = 255; pixels[i+1] = 0; pixels[i+2] = 0
            }
          }
          for y in g.y1...g.y2 {
            for xx in [g.x1, g.x2] where xx >= 0 && xx < w {
              let i = (y * w + xx) * 4
              pixels[i] = 255; pixels[i+1] = 0; pixels[i+2] = 0
            }
          }
        }
        let provider = CGDataProvider(data: Data(pixels) as CFData)!
        if let cg = CGImage(width: w, height: h, bitsPerComponent: 8, bitsPerPixel: 32,
                            bytesPerRow: bytesPerRow, space: CGColorSpaceCreateDeviceRGB(),
                            bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                            provider: provider, decode: nil, shouldInterpolate: false, intent: .defaultIntent),
           let pngData = UIImage(cgImage: cg).pngData() {
          try? pngData.write(to: overlayPath)
          debugOverlayUri = overlayPath.absoluteString
          dbg("Debug overlay saved: \\(overlayPath.path)")
        }
      }
      #endif

      // ── Build 28×28 EMNIST grids per group ─────────────────────
      var results = [[String: Any]]()
      for g in sortedGroups {
        let bx = g.x1; let by = g.y1
        let bw = g.x2 - bx + 1; let bh = g.y2 - by + 1
        let maxRange = Float(max(bw, bh))
        let s = INNER / maxRange
        let ox = (Float(GRID) - Float(bw) * s) / 2.0
        let oy = (Float(GRID) - Float(bh) * s) / 2.0

        // Compute gray range in bounding box for normalization
        var bboxGrayMin = 255; var bboxGrayMax = 0
        for py in g.y1...g.y2 { for px in g.x1...g.x2 {
          let gVal = gray[py * w + px]
          if gVal < bboxGrayMin { bboxGrayMin = gVal }
          if gVal > bboxGrayMax { bboxGrayMax = gVal }
        }}
        let grayRange = max(1, bboxGrayMax - bboxGrayMin)
        dbg("  grid grayscale: min=\(bboxGrayMin) max=\(bboxGrayMax) range=\(grayRange)")

        var grid = [Float](repeating: 0, count: GRID * GRID)
        for py in g.y1...g.y2 { for px in g.x1...g.x2 {
          // Normalize: ink → 1.0, paper → 0.0 (preserves gradients)
          let gv: Float = inverted
            ? Float(gray[py * w + px] - bboxGrayMin) / Float(grayRange)
            : Float(bboxGrayMax - gray[py * w + px]) / Float(grayRange)
          guard gv >= 0.15 else { continue }  // suppress paper noise
          let gx = Int(Float(px - bx) * s + ox)
          let gy = Int(Float(py - by) * s + oy)
          if gx >= 0 && gx < GRID && gy >= 0 && gy < GRID {
            let gi = gy * GRID + gx
            grid[gi] = max(grid[gi], gv)
          }
        }}

        var thick = grid
        for gy in 0..<GRID { for gx in 0..<GRID {
          if grid[gy * GRID + gx] > 0.3 { continue }
          var mx: Float = 0
          for dy in -2...2 { for dx in -2...2 {
            let nx = gx + dx; let ny = gy + dy
            if nx >= 0 && nx < GRID && ny >= 0 && ny < GRID {
              mx = max(mx, grid[ny * GRID + nx])
            }
          }}
          if mx > 0.3 { thick[gy * GRID + gx] = mx * 0.35 }
        }}

        let charDict: [String: Any] = [
          "pixels": thick.map { Double($0) },
          "boundingBox": [
            "x": Double(bx) / Double(w),
            "y": Double(by) / Double(h),
            "width": Double(bw) / Double(w),
            "height": Double(bh) / Double(h)
          ]
        ]
        results.append(charDict)
      }

      let dt = Int(Date().timeIntervalSince(t0) * 1000)
      dbg("── recognizeHandwriting END count=\\(results.count) took=\\(dt)ms")

      var response: [String: Any] = ["characters": results, "count": results.count]
      if let uri = debugOverlayUri { response["debugOverlayUri"] = uri }
      if let path = currentLogPath { response["debugLogUri"] = path.absoluteString }
      if let jsonData = try? JSONSerialization.data(withJSONObject: response),
         let jsonStr = String(data: jsonData, encoding: .utf8) {
        resolve(jsonStr)
      } else {
        resolve("{\\"characters\\":[],\\"count\\":0}")
      }
    }
  }
}
`;

const HANDWRITING_MODULE_M = `#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HandwritingOcrModule, NSObject)
RCT_EXTERN_METHOD(recognizeHandwriting:(NSString *)imageUri
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(appendLog:(NSString *)line
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
`;

// ─── Plugin: Android modifications ───────────────────────────────

function withHandwritingOcrAndroid(config) {
  // Register HandwritingOcrPackage in MainApplication
  config = withMainApplication(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes('HandwritingOcrPackage')) {
      // Add import
      config.modResults.contents = contents.replace(
        /import com\.facebook\.react\.defaults\.DefaultReactNativeHost/,
        `import com.facebook.react.defaults.DefaultReactNativeHost\nimport com.letterlens.app.HandwritingOcrPackage`
      );
      // Add package to getPackages()
      config.modResults.contents = config.modResults.contents.replace(
        /packages\.add\(MainReactPackage\(\)\)/,
        `packages.add(MainReactPackage())\n              packages.add(HandwritingOcrPackage())`
      );
      // Fallback: try PackageList pattern
      if (!config.modResults.contents.includes('HandwritingOcrPackage()')) {
        config.modResults.contents = config.modResults.contents.replace(
          /PackageList\(this\)\.packages/,
          `PackageList(this).packages.apply { add(HandwritingOcrPackage()) }`
        );
      }
    }
    return config;
  });

  // Write Kotlin source files
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const packageDir = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        'com',
        'letterlens',
        'app'
      );
      fs.mkdirSync(packageDir, { recursive: true });
      fs.writeFileSync(
        path.join(packageDir, 'HandwritingOcrModule.kt'),
        HANDWRITING_MODULE_KT
      );
      fs.writeFileSync(
        path.join(packageDir, 'HandwritingOcrPackage.kt'),
        HANDWRITING_PACKAGE_KT
      );
      return config;
    },
  ]);

  return config;
}

// ─── Plugin: iOS modifications ───────────────────────────────────

function withHandwritingOcrIos(config) {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosDir = path.join(projectRoot, 'ios', config.modRequest.projectName);
      fs.mkdirSync(iosDir, { recursive: true });
      fs.writeFileSync(
        path.join(iosDir, 'HandwritingOcrModule.swift'),
        HANDWRITING_MODULE_SWIFT
      );
      fs.writeFileSync(
        path.join(iosDir, 'HandwritingOcrModule.m'),
        HANDWRITING_MODULE_M
      );
      return config;
    },
  ]);

  return config;
}

// ─── Main plugin export ──────────────────────────────────────────

function withHandwritingOcr(config) {
  config = withHandwritingOcrAndroid(config);
  config = withHandwritingOcrIos(config);
  return config;
}

module.exports = withHandwritingOcr;
