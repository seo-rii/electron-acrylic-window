{
  "targets": [
    {
      "target_name": "vibrancy-wrapper",
      "conditions":[
        ["OS=='win'", {
          "sources": [
            "src/native/win10.cpp"
          ]
        }]
      ],
      "cflags": [
        "-O3"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ]
    }
  ]
}
