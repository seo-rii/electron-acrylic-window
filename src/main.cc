#include <napi.h>
#include <assert.h>
#include <dwmapi.h>

void setVibrancy(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "WINDOW_NOT_GIVEN").ThrowAsJavaScriptException();
        return;
    }
    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "UNKNOWN").ThrowAsJavaScriptException();
        return;
    }
    HWND hwnd = (HWND) info[0].As<Napi::Number>().Int64Value();
}

void disableVibrancy(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1) {
        Napi::TypeError::New(env, "WINDOW_NOT_GIVEN").ThrowAsJavaScriptException();
        return;
    }
    if (!info[0].IsNumber()) {
        Napi::TypeError::New(env, "UNKNOWN").ThrowAsJavaScriptException();
        return;
    }
    HWND hwnd = (HWND) info[0].As<Napi::Number>().Int64Value();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "setVibrancy"),
                Napi::Function::New(env, setVibrancy));
    exports.Set(Napi::String::New(env, "disableVibrancy"),
                Napi::Function::New(env, disableVibrancy));
    return exports;
}

NODE_API_MODULE(hello, Init)