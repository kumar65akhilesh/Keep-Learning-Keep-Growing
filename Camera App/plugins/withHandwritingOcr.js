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
import java.util.LinkedList

class HandwritingOcrModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "HandwritingOcrModule"

    companion object {
        private const val TAG = "ScanOCR"
        private const val GRID = 28
        private const val INNER = 20            // centred content area
        private const val MAX_WORK_W = 800      // downscale for speed
    }

    @ReactMethod
    fun recognizeHandwriting(imageUri: String, promise: Promise) {
        Thread {
            try {
                Log.d(TAG, "segmentCharacters called, uri=$imageUri")
                val uri = Uri.parse(imageUri)
                val input = reactApplicationContext.contentResolver.openInputStream(uri)
                    ?: return@Thread promise.reject("SEG_ERR", "Cannot open image")
                val original = BitmapFactory.decodeStream(input)
                input.close()
                if (original == null) return@Thread promise.reject("SEG_ERR", "Cannot decode image")

                // ── Down-scale ────────────────────────────────────────
                val scale = if (original.width > MAX_WORK_W)
                    MAX_WORK_W.toFloat() / original.width else 1f
                val w = (original.width * scale).toInt()
                val h = (original.height * scale).toInt()
                val bmp = Bitmap.createScaledBitmap(original, w, h, true)
                if (bmp !== original) original.recycle()
                Log.d(TAG, "Working size: \${w}x\${h}")

                // ── Grayscale ─────────────────────────────────────────
                val gray = IntArray(w * h)
                for (y in 0 until h) {
                    for (x in 0 until w) {
                        val px = bmp.getPixel(x, y)
                        gray[y * w + x] = ((0.299 * Color.red(px)
                                          + 0.587 * Color.green(px)
                                          + 0.114 * Color.blue(px))).toInt()
                    }
                }
                bmp.recycle()

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

                val winHalf = maxOf(w, h) / 16   // ~6 % of image
                val binary = BooleanArray(w * h)
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
                        // Ink = darker than local mean minus small offset
                        binary[y * w + x] = gray[y * w + x] < (sum / cnt - 12)
                    }
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
                Log.d(TAG, "Raw components: \${bounds.size}")

                // ── Filter noise (too small / too large) ─────────────
                val minDim = maxOf(w, h) * 0.015
                val maxDim = maxOf(w, h) * 0.85
                val minPx  = (w * h * 0.00005).toInt().coerceAtLeast(4)

                val valid = bounds.filter { (_, b) ->
                    val bw = b[2] - b[0]; val bh = b[3] - b[1]
                    val dim = maxOf(bw, bh)
                    dim >= minDim && dim <= maxDim && b[4] >= minPx && bw >= 2 && bh >= 2
                }
                Log.d(TAG, "After filter: \${valid.size} components")

                // ── Sort left→right ──────────────────────────────────
                val sorted = valid.entries.sortedBy { it.value[0] }

                // ── Build 28×28 EMNIST grid for each component ───────
                val results = JSONArray()
                for ((lbl, b) in sorted) {
                    val bx = b[0]; val by = b[1]
                    val bw = b[2] - bx + 1; val bh = b[3] - by + 1
                    val maxRange = maxOf(bw, bh).toFloat()
                    val s = INNER / maxRange
                    val ox = (GRID - bw * s) / 2f
                    val oy = (GRID - bh * s) / 2f

                    val grid = FloatArray(GRID * GRID)
                    for (py in by..b[3]) for (px in bx..b[2]) {
                        if (labels[py * w + px] != lbl) continue
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
                Log.d(TAG, "Returning \${results.length()} character crops")

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

@objc(HandwritingOcrModule)
class HandwritingOcrModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { return false }

  private let GRID = 28
  private let INNER: Float = 20
  private let MAX_WORK: CGFloat = 800

  @objc
  func recognizeHandwriting(_ imageUri: String,
                             resolver resolve: @escaping RCTPromiseResolveBlock,
                             rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.global(qos: .userInitiated).async { [self] in
      guard let url = URL(string: imageUri),
            let data = try? Data(contentsOf: url),
            let original = UIImage(data: data),
            let cgOrig = original.cgImage else {
        reject("SEG_ERR", "Cannot load image", nil)
        return
      }

      // ── Downscale ──────────────────────────────────────────────
      let origW = cgOrig.width
      let origH = cgOrig.height
      let scale = origW > Int(MAX_WORK) ? MAX_WORK / CGFloat(origW) : 1.0
      let w = Int(CGFloat(origW) * scale)
      let h = Int(CGFloat(origH) * scale)

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

      // ── Integral image for adaptive threshold ──────────────────
      var integral = [Int64](repeating: 0, count: (w + 1) * (h + 1))
      for y in 0..<h {
        var rowSum: Int64 = 0
        for x in 0..<w {
          rowSum += Int64(gray[y * w + x])
          integral[(y + 1) * (w + 1) + (x + 1)] = rowSum + integral[y * (w + 1) + (x + 1)]
        }
      }

      let winHalf = max(w, h) / 16
      var binary = [Bool](repeating: false, count: w * h)
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
          binary[y * w + x] = Int64(gray[y * w + x]) < (sum / Int64(cnt) - 12)
        }
      }

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

      // ── Filter noise ───────────────────────────────────────────
      let minDim = Float(max(w, h)) * 0.015
      let maxDim = Float(max(w, h)) * 0.85
      let minPx  = max(Int(Float(w * h) * 0.00005), 4)

      let valid = bounds.filter { (_, b) in
        let bw = b[2] - b[0]; let bh = b[3] - b[1]
        let dim = max(bw, bh)
        return Float(dim) >= minDim && Float(dim) <= maxDim && b[4] >= minPx && bw >= 2 && bh >= 2
      }

      // ── Sort left → right ─────────────────────────────────────
      let sorted = valid.sorted { $0.value[0] < $1.value[0] }

      // ── Build 28×28 EMNIST grids ───────────────────────────────
      var results = [[String: Any]]()
      for (lbl, b) in sorted {
        let bx = b[0]; let by = b[1]
        let bw = b[2] - bx + 1; let bh = b[3] - by + 1
        let maxRange = Float(max(bw, bh))
        let s = INNER / maxRange
        let ox = (Float(GRID) - Float(bw) * s) / 2.0
        let oy = (Float(GRID) - Float(bh) * s) / 2.0

        var grid = [Float](repeating: 0, count: GRID * GRID)
        for py in by...b[3] { for px in bx...b[2] {
          guard labels[py * w + px] == lbl else { continue }
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

      let response: [String: Any] = ["characters": results, "count": results.count]
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
