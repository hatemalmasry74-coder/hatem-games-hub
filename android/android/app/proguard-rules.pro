# Only used when building with -PminifyRelease=true (R8 is off by default - see docs/play/DECISION.md).
# Capacitor + Cordova load plugins by reflection / by name from config.xml:
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { @com.getcapacitor.annotation.PermissionCallback <methods>; @com.getcapacitor.annotation.ActivityCallback <methods>; @com.getcapacitor.PluginMethod public <methods>; }
-keep class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin
-keep class cc.fovea.** { *; }
-keep class com.capacitorjs.plugins.** { *; }
-keep class moody.wrapper.** { *; }
-keepattributes *Annotation*, Signature, InnerClasses, EnclosingMethod
-dontwarn org.apache.cordova.**
-dontwarn com.android.billingclient.**
