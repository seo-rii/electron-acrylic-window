# electron-acrylic-window
  
[![Build Status](https://travis-ci.org/04seohyun/electron-acrylic-window.svg?branch=master)](https://travis-ci.org/04seohyun/electron-acrylic-window)  
  
Simply add vibrancy effect to Electron application on Windows.

Works only on Windows 10.

Inspired from ```electron-vibrancy```.

## Download

```shell script
npm i electron-acrylic-window
```

## Usage
### setVibrancy
```javascript
setVibrancy(win);
```
Enables Vibrancy to window.  
There is no return value. If it fails to set vibrancy, it throws error.

Errors
* WINDOW_NOT_GIVEN  
Error that occurs when ```win``` parameter is not passed
* UNKNOWN  
Unknown error.

### disableVibrancy
```javascript
disableVibrancy(win);
```
Disables Vibrancy to window.  
There is no return value. If it fails to set vibrancy, it throws error.

Errors
* WINDOW_NOT_GIVEN  
Error that occurs when ```win``` parameter is not passed
* UNKNOWN  
Unknown error.