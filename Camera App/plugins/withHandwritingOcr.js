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
import android.net.Uri
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.FileOutputStream
import java.util.LinkedList

class HandwritingOcrModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "HandwritingOcrModule"

    companion object {
        private const val TAG = "ScanOCR"
        private const val GRID = 28
        private const val INNER = 20            // centred content area
        private const val MAX_WORK_W = 800      // downscale for speed
        // Phase 2 tuning
        private const val THRESH_OFFSET = 18
        private const val WIN_DIVISOR = 12
    }

    @ReactMethod
    fun recognizeHandwriting(imageUri: String, promise: Promise) {
        Thread {
            try {
                val t0 = System.currentTimeMillis()
                Log.d(TAG, "── recognizeHandwriting START uri=$imageUri")
                val uri = Uri.parse(imageUri)
                val input = reactApplicationContext.contentResolver.openInputStream(uri)
                    ?: return@Thread promise.reject("SEG_ERR", "Cannot open image")
                val original = BitmapFactory.decodeStream(input)
                input.close()
                if (original == null) return@Thread promise.reject("SEG_ERR", "Cannot decode image")
                Log.d(TAG, "Original image: \${original.width}x\${original.height}")

                // ── Down-scale ────────────────────────────────────────
                val scale = if (original.width > MAX_WORK_W)
                    MAX_WORK_W.toFloat() / original.width else 1f
                val w = (original.width * scale).toInt()
                val h = (original.height * scale).toInt()
                val bmp = Bitmap.createScaledBitmap(original, w, h, true)
                if (bmp !== original) original.recycle()
                Log.d(TAG, "Working size: \${w}x\${h} (scale=\${scale})")

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
                Log.d(TAG, "Gray stats: min=\$grayMin max=\$grayMax mean=\${graySum / (w*h)}")

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
                Log.d(TAG, "Adaptive thresh: winHalf=\$winHalf offset=\$THRESH_OFFSET")
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
                Log.d(TAG, "Binary: inkPixels=\$inkCount (\${"%.2f".format(100.0 * inkCount / (w*h))}%)")

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
                Log.d(TAG, "Raw components: \${bounds.size}")
                if (bounds.size <= 50) {
                    for ((lbl, b) in bounds) {
                        Log.d(TAG, "  raw lbl=\$lbl x=\${b[0]} y=\${b[1]} w=\${b[2]-b[0]+1} h=\${b[3]-b[1]+1} px=\${b[4]}")
                    }
                } else {
                    Log.d(TAG, "  (skipping per-component dump; too many)")
                }

                // ── Filter noise (Phase 2 tightened) ─────────────────
                val minDim = maxOf(w, h) * 0.03
                val maxDim = maxOf(w, h) * 0.85
                val minPx  = (maxOf(w, h) * 0.4).toInt().coerceAtLeast(8)
                Log.d(TAG, "Filter: minDim=\${"%.1f".format(minDim)} maxDim=\${"%.1f".format(maxDim)} minPx=\$minPx aspect=1/8..8")

                val valid = mutableMapOf<Int, IntArray>()
                for ((lbl, b) in bounds) {
                    val bw = b[2] - b[0]; val bh = b[3] - b[1]
                    val dim = maxOf(bw, bh)
                    val aspect = if (bh == 0) 999.0 else bw.toDouble() / bh
                    val reason = when {
                        bw < 2 || bh < 2 -> "tiny_bw_bh"
                        dim < minDim -> "too_small_dim(\$dim<\${"%.0f".format(minDim)})"
                        dim > maxDim -> "too_large_dim(\$dim>\${"%.0f".format(maxDim)})"
                        b[4] < minPx -> "too_few_px(\${b[4]}<\$minPx)"
                        aspect > 8.0 || aspect < 0.125 -> "bad_aspect(\${"%.2f".format(aspect)})"
                        else -> null
                    }
                    if (reason == null) {
                        valid[lbl] = b
                    } else if (bounds.size <= 50) {
                        Log.d(TAG, "  REJECT lbl=\$lbl reason=\$reason bw=\$bw bh=\$bh px=\${b[4]}")
                    }
                }
                Log.d(TAG, "After filter: \${valid.size} components")

                // ── Phase 2: Merge nearby components (one char per group) ──
                // Group label keys; merge by proximity using median height H.
                val keys = valid.keys.toList()
                val heights = keys.map { valid[it]!![3] - valid[it]!![1] + 1 }.sorted()
                val medH = if (heights.isEmpty()) 0 else heights[heights.size / 2]
                val gapMaxX = medH * 0.4
                val gapMaxY = medH * 1.5
                Log.d(TAG, "Merge: medH=\$medH gapMaxX=\${"%.1f".format(gapMaxX)} gapMaxY=\${"%.1f".format(gapMaxY)}")

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
                        Log.d(TAG, "  MERGE lbl=\${keys[i]} + lbl=\${keys[j]} dx=\$dx dy=\$dy")
                        union(i, j)
                    }
                }

                // Build groups: rootIdx -> merged bbox + member labels
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
                Log.d(TAG, "After merge: \${groups.size} character groups")

                // ── Sort groups left→right ───────────────────────────
                val sortedGroups = groups.values.sortedBy { it.x1 }
                for ((idx, g) in sortedGroups.withIndex()) {
                    Log.d(TAG, "  group#\$idx x=\${g.x1} y=\${g.y1} w=\${g.x2-g.x1+1} h=\${g.y2-g.y1+1} members=\${g.members}")
                }

                // ── Optional debug overlay dump (DEBUG builds only) ──
                var debugOverlayUri: String? = null
                if (BuildConfig.DEBUG) {
                    try {
                        val outDir = reactApplicationContext.getExternalFilesDir(null)
                            ?: reactApplicationContext.filesDir
                        val overlay = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)
                        for (y in 0 until h) for (x in 0 until w) {
                            overlay.setPixel(x, y, if (binary[y * w + x]) Color.BLACK else Color.WHITE)
                        }
                        // Mark group bboxes in red
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
                        val debugFile = java.io.File(outDir, "scanocr_debug_\${t0}.png")
                        FileOutputStream(debugFile).use { overlay.compress(Bitmap.CompressFormat.PNG, 90, it) }
                        overlay.recycle()
                        debugOverlayUri = "file://\${debugFile.absolutePath}"
                        Log.d(TAG, "Debug overlay saved: \${debugFile.absolutePath}")
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed to write debug overlay: \${e.message}")
                    }
                }

                // ── Build 28×28 EMNIST grid per group ────────────────
                val memberSet = HashSet<Int>()
                val results = JSONArray()
                for (g in sortedGroups) {
                    val bx = g.x1; val by = g.y1
                    val bw = g.x2 - bx + 1; val bh = g.y2 - by + 1
                    val maxRange = maxOf(bw, bh).toFloat()
                    val s = INNER / maxRange
                    val ox = (GRID - bw * s) / 2f
                    val oy = (GRID - bh * s) / 2f

                    memberSet.clear()
                    memberSet.addAll(g.members)

                    val grid = FloatArray(GRID * GRID)
                    for (py in g.y1..g.y2) for (px in g.x1..g.x2) {
                        val lbl = labels[py * w + px]
                        if (lbl == 0 || !memberSet.contains(lbl)) continue
                        val gv = (255 - gray[py * w + px]) / 255f   // invert
                        val gx = ((px - bx) * s + ox).toInt()
                        val gy = ((py - by) * s + oy).toInt()
                        if (gx in 0 until GRID && gy in 0 until GRID) {
                            val gi = gy * GRID + gx
                            grid[gi] = maxOf(grid[gi], gv)
                        }
                    }

                    // Thicken strokes slightly (1-px dilate max) for EMNIST match
                    val thick = grid.copyOf()
                    for (gy in 0 until GRID) for (gx in 0 until GRID) {
                        if (grid[gy * GRID + gx] > 0.3f) continue
                        var mx = 0f
                        for (dy in -1..1) for (dx in -1..1) {
                            val nx = gx + dx; val ny = gy + dy
                            if (nx in 0 until GRID && ny in 0 until GRID)
                                mx = maxOf(mx, grid[ny * GRID + nx])
                        }
                        if (mx > 0.5f) thick[gy * GRID + gx] = mx * 0.4f
                    }

                    val pxArr = JSONArray()
                    for (v in thick) pxArr.put(v.toDouble())

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
                val dt = System.currentTimeMillis() - t0
                Log.d(TAG, "── recognizeHandwriting END count=\${results.length()} took=\${dt}ms")

                promise.resolve(resp.toString())
            } catch (e: Exception) {
                Log.e(TAG, "Segmentation failed", e)
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
  private let MAX_WORK: CGFloat = 800
  // Phase 2 tuning
  private let THRESH_OFFSET: Int64 = 18
  private let WIN_DIVISOR = 12
  private let log = OSLog(subsystem: "com.letterlens.app", category: "ScanOCR")

  @objc
  func recognizeHandwriting(_ imageUri: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async { [self] in
      let t0 = Date()
      os_log("── recognizeHandwriting START uri=%{public}@", log: log, type: .debug, imageUri)
      guard let url = URL(string: imageUri),
            let data = try? Data(contentsOf: url),
            let original = UIImage(data: data),
            let cgOrig = original.cgImage else {
        reject("SEG_ERR", "Cannot load image", nil)
        return
      }
      os_log("Original image: %dx%d", log: log, type: .debug, cgOrig.width, cgOrig.height)

      // ── Downscale ──────────────────────────────────────────────
      let origW = cgOrig.width
      let origH = cgOrig.height
      let scale = origW > Int(MAX_WORK) ? MAX_WORK / CGFloat(origW) : 1.0
      let w = Int(CGFloat(origW) * scale)
      let h = Int(CGFloat(origH) * scale)
      os_log("Working size: %dx%d scale=%.3f", log: log, type: .debug, w, h, Double(scale))

      // Render to 8-bit grayscale
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
      os_log("Gray stats: min=%d max=%d mean=%lld", log: log, type: .debug, Int(gmin), Int(gmax), gsum / Int64(w * h))

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
      os_log("Adaptive thresh: winHalf=%d offset=%lld", log: log, type: .debug, winHalf, THRESH_OFFSET)
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
      os_log("Binary: inkPixels=%d (%.2f%%)", log: log, type: .debug, inkCount, 100.0 * Double(inkCount) / Double(w * h))

      // ── Connected-component labelling (8-connected BFS) ────────
      var labels = [Int](repeating: 0, count: w * h)
      var nextLabel = 1
      var bounds = [Int: [Int]]()  // label → [minX, minY, maxX, maxY, pixCount]

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
      os_log("Raw components: %d", log: log, type: .debug, bounds.count)
      if bounds.count <= 50 {
        for (lbl, b) in bounds {
          os_log("  raw lbl=%d x=%d y=%d w=%d h=%d px=%d", log: log, type: .debug, lbl, b[0], b[1], b[2]-b[0]+1, b[3]-b[1]+1, b[4])
        }
      }

      // ── Filter noise (Phase 2 tightened) ───────────────────────
      let minDim = Float(max(w, h)) * 0.03
      let maxDim = Float(max(w, h)) * 0.85
      let minPx  = max(Int(Float(max(w, h)) * 0.4), 8)
      os_log("Filter: minDim=%.1f maxDim=%.1f minPx=%d aspect=1/8..8", log: log, type: .debug, Double(minDim), Double(maxDim), minPx)

      var valid = [Int: [Int]]()
      for (lbl, b) in bounds {
        let bw = b[2] - b[0]; let bh = b[3] - b[1]
        let dim = max(bw, bh)
        let aspect: Double = bh == 0 ? 999.0 : Double(bw) / Double(bh)
        var reason: String? = nil
        if bw < 2 || bh < 2 { reason = "tiny_bw_bh" }
        else if Float(dim) < minDim { reason = "too_small_dim" }
        else if Float(dim) > maxDim { reason = "too_large_dim" }
        else if b[4] < minPx { reason = "too_few_px" }
        else if aspect > 8.0 || aspect < 0.125 { reason = "bad_aspect" }
        if reason == nil { valid[lbl] = b }
        else if bounds.count <= 50 {
          os_log("  REJECT lbl=%d reason=%{public}@ bw=%d bh=%d px=%d", log: log, type: .debug, lbl, reason!, bw, bh, b[4])
        }
      }
      os_log("After filter: %d components", log: log, type: .debug, valid.count)

      // ── Phase 2: Merge nearby components ───────────────────────
      let keys = Array(valid.keys)
      let heights = keys.map { valid[$0]![3] - valid[$0]![1] + 1 }.sorted()
      let medH = heights.isEmpty ? 0 : heights[heights.count / 2]
      let gapMaxX = Double(medH) * 0.4
      let gapMaxY = Double(medH) * 1.5
      os_log("Merge: medH=%d gapMaxX=%.1f gapMaxY=%.1f", log: log, type: .debug, medH, gapMaxX, gapMaxY)

      var parent = Array(0..<keys.count)
      func find(_ i: Int) -> Int { var r = i; while parent[r] != r { r = parent[r] }; var c = i; while parent[c] != c { let n = parent[c]; parent[c] = r; c = n }; return r }
      func union(_ a: Int, _ b: Int) { let ra = find(a); let rb = find(b); if ra != rb { parent[ra] = rb } }

      for i in 0..<keys.count { for j in (i+1)..<keys.count {
        let a = valid[keys[i]]!; let b = valid[keys[j]]!
        let dx = max(0, max(a[0], b[0]) - min(a[2], b[2]))
        let dy = max(0, max(a[1], b[1]) - min(a[3], b[3]))
        if Double(dx) <= gapMaxX && Double(dy) <= gapMaxY {
          os_log("  MERGE lbl=%d + lbl=%d dx=%d dy=%d", log: log, type: .debug, keys[i], keys[j], dx, dy)
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
      os_log("After merge: %d character groups", log: log, type: .debug, groups.count)

      let sortedGroups = groups.values.sorted { $0.x1 < $1.x1 }
      for (idx, g) in sortedGroups.enumerated() {
        os_log("  group#%d x=%d y=%d w=%d h=%d members=%d", log: log, type: .debug, idx, g.x1, g.y1, g.x2-g.x1+1, g.y2-g.y1+1, g.members.count)
      }

      // ── Optional debug overlay dump ────────────────────────────
      var debugOverlayUri: String? = nil
      #if DEBUG
      do {
        let docsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        let overlayPath = docsDir.appendingPathComponent("scanocr_debug_\\(Int(t0.timeIntervalSince1970 * 1000)).png")
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
          os_log("Debug overlay saved: %{public}@", log: log, type: .debug, overlayPath.path)
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
        let memberSet = Set(g.members)

        var grid = [Float](repeating: 0, count: GRID * GRID)
        for py in g.y1...g.y2 { for px in g.x1...g.x2 {
          let lbl = labels[py * w + px]
          guard lbl != 0 && memberSet.contains(lbl) else { continue }
          let gv = Float(255 - gray[py * w + px]) / 255.0
          let gx = Int(Float(px - bx) * s + ox)
          let gy = Int(Float(py - by) * s + oy)
          if gx >= 0 && gx < GRID && gy >= 0 && gy < GRID {
            let gi = gy * GRID + gx
            grid[gi] = max(grid[gi], gv)
          }
        }}

        // Thicken strokes (1-px dilate)
        var thick = grid
        for gy in 0..<GRID { for gx in 0..<GRID {
          if grid[gy * GRID + gx] > 0.3 { continue }
          var mx: Float = 0
          for dy in -1...1 { for dx in -1...1 {
            let nx = gx + dx; let ny = gy + dy
            if nx >= 0 && nx < GRID && ny >= 0 && ny < GRID {
              mx = max(mx, grid[ny * GRID + nx])
            }
          }}
          if mx > 0.5 { thick[gy * GRID + gx] = mx * 0.4 }
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
      os_log("── recognizeHandwriting END count=%d took=%dms", log: log, type: .debug, results.count, dt)

      var response: [String: Any] = ["characters": results, "count": results.count]
      if let uri = debugOverlayUri { response["debugOverlayUri"] = uri }
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
