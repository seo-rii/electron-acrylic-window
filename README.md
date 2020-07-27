# electron-acrylic-window

<img alt="logo" src="./logo.png" width="250"> 
  
[![Build Status](https://travis-ci.com/seo-rii/electron-acrylic-window.svg?branch=master)](https://travis-ci.com/seo-rii/electron-acrylic-window)
[![Dependencies](https://david-dm.org/seo-rii/electron-acrylic-window.svg)](https://david-dm.org/seo-rii/electron-acrylic-window) 
[![npm version](https://badge.fury.io/js/electron-acrylic-window.svg)](https://badge.fury.io/js/electron-acrylic-window)  

Simply add vibrancy effect to Electron application on Windows.

Works only on Windows 10. If os is not Windows 10, it will call original function.  

Inspired from ```electron-vibrancy```.

## Download

You should install Visual studio or Visual C++ build tools before install this.

```shell script
npm i electron-acrylic-window --save
```

## Screenshots
![Screenshot1](./screenshots/1.png)

## Usage
### BrowserWindow
Wrapper class for ```BrowserWindow```.  

If OS is not Windows 10, it works perfectly the same.  

If OS is Windows 10, it overrides construtor option and ```setVibrancy``` method to work properly on Windows 10.
### setVibrancy
```javascript
setVibrancy(win, op = null);
```
Enables Vibrancy to window.  
There is no return value. If it fails to set vibrancy, it throws error.  
```win``` should be frameLess, and transparent.  
This function will call ```win.setVibrancy(op)``` if os is not Windows 10.  

#### Errors
* WINDOW_NOT_GIVEN  
Error that occurs when ```win``` parameter is not passed.
* NOT_VALID_WINDOW   
Error that occurs when ```win``` parameter is not valid Electron window.
* FAIL_LOAD_DLL  
Error that occurs when fails to load SetWindowCompositionAttribute from user32.dll
* UNKNOWN  
Unknown error.

### disableVibrancy
```javascript
disableVibrancy(win);
```
Disables Vibrancy to window.  
There is no return value. If it fails to disable vibrancy, it throws error.  
```win``` should be frameLess, and transparent.
This function will call ```win.setVibrancy(null)``` if os is not Windows 10.  

#### Errors
* WINDOW_NOT_GIVEN  
Error that occurs when ```win``` parameter is not passed.
* NOT_VALID_WINDOW   
Error that occurs when ```win``` parameter is not valid Electron window.
* UNKNOWN  
Unknown error.


## Example
```javascript
const {BrowserWindow} = require('electron-acrylic-window');
const {app} = require('electron');

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: true,
        vibrancy: 'light'
    });
    win.loadURL(`file://${__dirname}/index.html`);
    setTimeout(()=>{
        win.setVibrancy();
    }, 3000);
}

app.on('ready', createWindow);

```