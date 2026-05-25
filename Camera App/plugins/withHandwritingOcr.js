/**
 * Expo Config Plugin — Handwriting OCR Native Module
 *
 * Injects:
 *   • Android: Kotlin native module using ML Kit Text Recognition v2
 *   • iOS: Swift native module using Apple Vision framework
 *   • Gradle dependency for ML Kit v2
 *
 * This plugin runs during `npx expo prebuild` so the native code
 * is regenerated every time, surviving `--clean` rebuilds.
 */

const {
  withMainApplication,
  withAppBuildGradle,
  withDangerousMod,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// ─── Android: Kotlin Native Module ───────────────────────────────

const HANDWRITING_MODULE_KT = `package com.letterlens.app

import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import android.net.Uri
import org.json.JSONArray
import org.json.JSONObject

class HandwritingOcrModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "HandwritingOcrModule"

    private val recognizer by lazy {
        TextRecognition.getClient(TextRecognizerOptions.Builder().build())
    }

    @ReactMethod
    fun recognizeHandwriting(imageUri: String, promise: Promise) {
        try {
            val uri = Uri.parse(imageUri)
            val image = InputImage.fromFilePath(reactApplicationContext, uri)

            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val results = JSONArray()

                    val fullText = visionText.text
                    val imageWidth = image.width.toFloat().coerceAtLeast(1f)
                    val imageHeight = image.height.toFloat().coerceAtLeast(1f)

                    for (block in visionText.textBlocks) {
                        for (line in block.lines) {
                            for (element in line.elements) {
                                val text = element.text
                                val box = element.boundingBox
                                val confidence = element.confidence ?: 0.8f

                                // Split element text into individual characters
                                val chars = text.toCharArray()
                                val elementWidth = box?.width()?.toFloat() ?: 0f
                                val charWidth = if (chars.isNotEmpty()) elementWidth / chars.size else 0f

                                for ((i, char) in chars.withIndex()) {
                                    val charObj = JSONObject()
                                    charObj.put("text", char.toString())
                                    charObj.put("confidence", confidence.toDouble())

                                    val bbox = JSONObject()
                                    if (box != null) {
                                        bbox.put("x", ((box.left + i * charWidth) / imageWidth).toDouble())
                                        bbox.put("y", (box.top.toFloat() / imageHeight).toDouble())
                                        bbox.put("width", (charWidth / imageWidth).toDouble())
                                        bbox.put("height", (box.height().toFloat() / imageHeight).toDouble())
                                    } else {
                                        bbox.put("x", 0)
                                        bbox.put("y", 0)
                                        bbox.put("width", 0)
                                        bbox.put("height", 0)
                                    }
                                    charObj.put("boundingBox", bbox)
                                    results.put(charObj)
                                }
                            }
                        }
                    }

                    val response = JSONObject()
                    response.put("characters", results)
                    response.put("rawText", fullText)

                    promise.resolve(response.toString())
                }
                .addOnFailureListener { e ->
                    promise.reject("HANDWRITING_OCR_ERROR", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("HANDWRITING_OCR_ERROR", e.message, e)
        }
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

// ─── iOS: Swift Native Module ────────────────────────────────────

const HANDWRITING_MODULE_SWIFT = `import Foundation
import Vision
import UIKit

@objc(HandwritingOcrModule)
class HandwritingOcrModule: NSObject {

  @objc
  static func requiresMainQueueSetup() -> Bool { return false }

  @objc
  func recognizeHandwriting(_ imageUri: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    guard let url = URL(string: imageUri),
          let imageData = try? Data(contentsOf: url),
          let image = UIImage(data: imageData),
          let cgImage = image.cgImage else {
      reject("HANDWRITING_OCR_ERROR", "Failed to load image from URI", nil)
      return
    }

    let imageWidth = CGFloat(cgImage.width)
    let imageHeight = CGFloat(cgImage.height)

    let request = VNRecognizeTextRequest { request, error in
      if let error = error {
        reject("HANDWRITING_OCR_ERROR", error.localizedDescription, error)
        return
      }

      guard let observations = request.results as? [VNRecognizedTextObservation] else {
        resolve("{\\"characters\\":[],\\"rawText\\":\\"\\"}")
        return
      }

      var characters: [[String: Any]] = []
      var fullText = ""

      for observation in observations {
        guard let candidate = observation.topCandidates(1).first else { continue }
        let text = candidate.string
        fullText += text + " "

        let box = observation.boundingBox
        let chars = Array(text)
        let charWidth = box.width / CGFloat(max(chars.count, 1))

        for (i, char) in chars.enumerated() {
          let charDict: [String: Any] = [
            "text": String(char),
            "confidence": Double(observation.confidence),
            "boundingBox": [
              "x": Double(box.origin.x + CGFloat(i) * charWidth),
              "y": Double(1.0 - box.origin.y - box.height),
              "width": Double(charWidth),
              "height": Double(box.height)
            ]
          ]
          characters.append(charDict)
        }
      }

      let response: [String: Any] = [
        "characters": characters,
        "rawText": fullText.trimmingCharacters(in: .whitespaces)
      ]

      if let jsonData = try? JSONSerialization.data(withJSONObject: response),
         let jsonString = String(data: jsonData, encoding: .utf8) {
        resolve(jsonString)
      } else {
        resolve("{\\"characters\\":[],\\"rawText\\":\\"\\"}")
      }
    }

    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false

    let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        try handler.perform([request])
      } catch {
        reject("HANDWRITING_OCR_ERROR", error.localizedDescription, error)
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
  // 1. Add ML Kit v2 dependency to build.gradle
  config = withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    if (!contents.includes('com.google.mlkit:text-recognition')) {
      config.modResults.contents = contents.replace(
        /dependencies\s*\{/,
        `dependencies {\n    implementation 'com.google.mlkit:text-recognition:16.0.1'`
      );
    }
    return config;
  });

  // 2. Register HandwritingOcrPackage in MainApplication
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

  // 3. Write Kotlin source files
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
