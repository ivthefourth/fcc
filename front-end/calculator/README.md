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
* Clear button reads "AC" when clear state is set to all and "C" when clear state is set to display.
* When an operator is selected, the button for that operator has a black outline.
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
* When the clear state is set to all, pressing the decimal button or a number button other than 0 zero will change the clear state to display. 
* When the clear state is set to all, pressing 0 will only change the clear state to display if the currently displayed number is not 0. -0 does not count as 0. 
* No buttons other than those listed above will update the clear state from all to display, even if the display value changes from pressing them. 
* Number inputs are limited to 9 digits. 
* When an operator is selected, pressing the sign button (+/-) will start a new number input with the value -0.
* Excluding the above case, pressing the sign button will toggle the sign of the currently displayed number. 
* If the sign button is pressed after the equals button is pressed and then a new number is input, the sign is not retained for the new input. 
* When adding or subtracting, pressing the percent button will result in <display value>% of the number that it is being added to, e.g., `50 + 10 % =` **55**.
* Excluding the above case, pressing the percent button will divide the display value by 100. 
* Pressing the clear button when the clear state is set to display will clear the display value (and display 0) but keep information like stored values/operators and selected operator. For example, inputting `9 + 5 = C =` results in **5**. 
* Pressing the clear button when the clear state is set to all will clear all the data
* Operations can be chained, e.g. `9 + 5 + 6 - 3 =` **17**
* Chained operations follow the order of operations, e.g. `9 + 5 x 5 x 2 =` **59**
* The selected operator can be changed
* If the selected operator is changed from multiply or divide to add or subtract while storing data due to order of operations, the stored data is evaluated immediately, e.g. `9 + 5 x 5 x +` will display **34**
* Pressing the equals button will evaluate the current operation
* Consecutively pressing the equals button with no other input will perform the previous operation repeatedly, e.g. `9 + 5 = = =` results in **24** (9 + 5 + 5 + 5)
If a number is not entered after selecting an operator, the currently displayed value will be used. For example, `9 + =` results in **18** (9 + 9). `3 x = + = - =` results in **0** ( (3\*3 + 3\*3) - (3\*3 + 3\*3) ) 

#### Differences
* Pressing the sign button when the display reads Error starts a new input with -0, toggling the sign toggles the display between -0 and 0; Toggling the sign in this way on the app toggles between -0 and Error, or if the Error is negative (-Error) it toggles between -Error and Error on the app (my version has no -Error). 
* When adding or subtracting, consecutive presses of the percent button without pressing any operator or the equals button: 
  * If a number is entered before pressing the percent button again, my version will act the same as it does when initially adding percents (`50 + 20 % 20 % =` **60** | i.e. 50 + 50 \* 0.20); the iPhone app will take the <current display value> percentage of the previous display value (`50 + 20 % 20 % =` **52** | i.e. 50 + (50 \* 0.20) \* 0.20 )
  * If a number is not entered before pressing the percent button again, my version will divide the display value by 100 (`50 + 10 % % =` **50.05** | i.e. 50 + (50 \* 0.10)/100 ); the iPhone app will act the same as it does when initially adding percents but with the new display value provided from previously evaluating the percent (`50 + 10 % % =` **52.5** | i.e. 50 + 50 \* (50 \* 0.1)/100)


## Dev Notes:
* If I make any more changes to the code, I should add tests for certain button inputs and display results to make sure nothing breaks, especially the more specific/weird cases. 


