#include <napi.h>
#include <assert.h>
#include <dwmapi.h>

Napi::Number setVibrancy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    return Napi::Number::New(env, 0);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "setVibrancy"),
                Napi::Function::New(env, setVibrancy));
    return exports;
}

NODE_API_MODULE(hello, Init)