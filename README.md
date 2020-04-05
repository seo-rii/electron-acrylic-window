# electron-acrylic-window

<img alt="logo" src="./logo.png" width="300"> 
  
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
* NOT_MATCHING_PLATFORM  
Error that occurs when os is not Windows 10.
* WINDOW_NOT_GIVEN  
Error that occurs when ```win``` parameter is not passed.
* NOT_VALID_WINDOW   
Error that occurs when ```win``` parameter is not valid Electron window.
* UNKNOWN  
Unknown error.

### disableVibrancy
```javascript
disableVibrancy(win);
```
Disables Vibrancy to window.  
There is no return value. If it fails to set vibrancy, it throws error.

Errors
* NOT_MATCHING_PLATFORM  
Error that occurs when os is not Windows 10.
* WINDOW_NOT_GIVEN  
Error that occurs when ```win``` parameter is not passed.
* NOT_VALID_WINDOW   
Error that occurs when ```win``` parameter is not valid Electron window.
* UNKNOWN  
Unknown error.