# iOS Calculator Remake
[Live Link](https://ivthefourth.github.io/fcc/front-end/calculator/)
## About
This is an attempt at recreating the iOS calculator app on the web with JavaScript. The goal was to match the functionality as closely as possible and give the interface a similar look. Only the portrait mode has been created, so there's no sin, cos, sqrt, etc., on this. I'm not currently planning to add the additional operators that the actual iOS calculator has. 

## Functionality Comparison
Note: I've based the functionality on my phone's calculator (iPhone 5c iOS 10.3.2) in portrait mode


### Touch Input

#### Similarities: 
* Only a single touch is allowed on the calculator buttons. With concurrent touches, the first one is tracked and others are ignored. The other items on this list assume the mentioned touch is the first touch.
* When a calculator button is touched the "keytap" sound is played and the button is darkened.
* If a touch is held and moved, the button the touch is focused on in a given moment will be darkened and any button that was previously darkened will become not darkened.
* When a touch is released, it will activate the calculator button that it was focused on in that moment
#### Differences: 

* The "keytap" sound is much louder on my phone's browser than on the native app
* Touching the display allows you to scroll the page or select the text; the native app prompts you to copy or paste when the display is double tapped or touched and held
* Sliding touch off the screen will activate the focused button; in the native app the button is not activated as such 


### Display

#### Similarities: 
* Numbers with magnitudes greater than or equal to 10^9 or 10^-9 are displayed in exponent notation
* The display only displays 9 digits. For exponential notation, the "e" counts as a digit, and the exponent counts as digits. Negative signs and commas do not count. 
* The number will be rounded to the smallest visible digit. (The actual value used for calculations is not rounded like this)
* Trailing zeros after the decimal are removed, even if there are significant digits "off-screen". If the digit immediately after the decimal is removed, then the decimal is also removed. 
* For numbers represented normally (not exponent notation), commas are added to separate the number at thousands and millions 
* For numbers with magnitude greater than 10^160, display Error
* Due to the rounding, there are some interesting occurrences: 
  * 999,999,999 + .9 results in 1,000,000,000; native app does this too, but the 1 is off screen. Experimenting with different numbers of 9s after the decimal can change the display to 1e9, and the number of 9s that this happens for is different on my version from the actual app. 
  * 0.99999999 divided by 10 eight times displays 1e-8, where normally scientific notation starts at e-9; native app does this too

#### Differences: 
* The cutoff for numbers with very small magnitude seems to depend on the number of digits after the decimal in exponent notation, but I haven't been able to find a clear pattern for numbers with many digits after the decimal, so for simplicity I've displayed Error for numbers with a magnitude smaller than 10^-100
* Negative errors of small magnitude display -Error on my phone, but I think that's silly so didn't have my remake do it. 

### Calculator Functionality

#### Similarities 

## Dev Notes:
* If I make any more changes to the code, I should add tests for certain button inputs and display results to make sure nothing breaks, especially the more specific/weird cases. 


