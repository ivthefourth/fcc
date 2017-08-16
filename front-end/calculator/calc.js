(function(){

    /*****************
        Audio
    ******************/
    var webAudio = window.AudioContext || window.webkitAudioContext;
    var audioCtx;

    //holds audio array buffer for button tap sound 
    var buffer = null;

    //if browser supports web audio, create a new audio context
    //and load the button tap sound 
    if (webAudio){
        audioCtx = new webAudio();
        var request = new XMLHttpRequest();
        request.open('GET', 'keytap.wav', true);

        //when request returns successfully, store audio file 
        //as an array buffer 
        request.responseType = 'arraybuffer';
        request.onload = function(){
            var audioData = request.response;
            audioCtx.decodeAudioData(audioData, function(data){
                buffer = data;
            });
        }
        request.send();
    }

    //play tap sound if web audio exists and sound was loaded correctly
    function playTap(){
        if (buffer !== null){
            var source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.connect(audioCtx.destination);
            source.start(audioCtx.currentTime + 0.01);
        }
    }



    /*****************
        Data
    ******************/
    /*var*/ state = {

        //user interface
        isFocused: false,       //True when a button has been clicked/touched and not released 
        focusType: null,        //Mouse or touch? 
        touchId: null,          //Which touch?
        touchedButton: null,    //Which button is the touch currently on?
        buttonCoords: null,     //coordinates of touchedButton
        topLeftButton: null,    //coordinates of top left button

        //calculator 
        input: [0],             //array of digits input by user
        inputLength: 1,         //Number of digits input by user, limit=9
        displayValue: 0,        //Numerical value of user input OR result
        displayType: 'input',   //Does the display show user input or result?
        isDecimal: false,       //User input has a decimal
        isNegative: false,      //User input is negative 
        newInput: true,         //pushing number button starts new input 
        clearType: 'all',       //Clear display or everything?
        chainEquals: false,     //set true after pressing equals, 
                                //allows repeat operations by pressing equals again

        operatorActive: false,  //When an operator is selected (using negative will put 0 as input)

        currentValue: null,     //stored from displayValue after a single operation
        currentOperator: null,  

        storedValue: null,      //stored from currentValue when respecting order of operations
        storedOperator: null,

        zeroNegative: false     //keeps track of whether result 0 is negative or not, purely aesthetic
    }

    //Dom elements
    var calculator = document.getElementById('calculator');
    var buttons = document.getElementsByTagName('button');
    var display = document.getElementById('result');
    var clear = getButtonFromData(buttons, 'btnType', 'clear');
    var operators = {};
    operators.add = getButtonFromData(buttons, 'btnValue', 'add');
    operators.subtract = getButtonFromData(buttons, 'btnValue', 'subtract');
    operators.multiply = getButtonFromData(buttons, 'btnValue', 'multiply');
    operators.divide = getButtonFromData(buttons, 'btnValue', 'divide');

    //adds event listeners to node list (nodes arg), events arg is array
    function addListenerToList(nodes, events, callback){
        //not calling for each directly on nodes because it is an
        //HTMLCollection and doesn't have a forEach Method
        Array.prototype.forEach.call(nodes, function(n){
            events.forEach( function(e) { n.addEventListener(e, callback)});
        });
    }

    //returns node from list that matches value for given html data attribute
    //(there should only be one)
    function getButtonFromData(nodes, dataAttr, value){
        var match;
        //not calling for each directly on nodes because it is an
        //HTMLCollection and doesn't have a forEach Method
        Array.prototype.forEach.call(nodes, function(n){
            if (n.dataset[dataAttr] === value){
                match = n;
            }
        });
        return match;
    }



    /*****************
        Mouse Events
    ******************/

    //done to emulate finger pressing and moving on phone screen
    //clicking a button highlights it 
    function handleMouseDown(e){
        e.preventDefault();
        //if there are no other active "pointer events"
        if( !state.isFocused ){
            playTap();
            e.currentTarget.classList.add('focused');
            state.isFocused = true;
            state.focusType = 'mouse';
        }
    }
    //moving pointer to other buttons highlight them instead
    function handleMouseEnter(e){
        if( state.isFocused && state.focusType === 'mouse'){
            e.currentTarget.classList.add('focused');
        }
    }
    function handleMouseLeave(e){
        if( state.isFocused && state.focusType === 'mouse'){
            e.currentTarget.classList.remove('focused');
        }
    }
    //lifting pointer triggers button that pointer is on 
    function handleMouseUp(e){
        //don't run this from document after a button runs it
        //since there are listeners with this callback on both
        e.stopPropagation(); 

        if( state.isFocused && state.focusType === 'mouse'){
            state.isFocused = false;
            state.focusType = null;

            //use button
            var target = e.currentTarget;
            if(target !== document){
                target.classList.remove('focused');
                useButton(target);
            }
        }
    }
    addListenerToList(buttons, ['mousedown'], handleMouseDown);
    addListenerToList(buttons, ['mouseenter'], handleMouseEnter);
    addListenerToList(buttons, ['mouseleave'], handleMouseLeave);
    addListenerToList(buttons, ['mouseup'], handleMouseUp);
    document.addEventListener('mouseup', handleMouseUp);



    /*****************
        Touch Events
    ******************/
    //touching a button highlights it 
    function handleTouchStart(e){
        e.preventDefault();
        //if there are no other active "pointer events"
        if( !state.isFocused ){
            playTap();
            e.currentTarget.classList.add('focused');
            state.isFocused = true;
            state.focusType = 'touch';
            state.touchId = e.changedTouches[0].identifier;
            state.touchedButton = e.currentTarget;

            //store coordinates of current button so we know when the touch
            //moves off of this button
            state.buttonCoords = getPageCoords(e.currentTarget);
            //get coordinates of top left button and button width/height
            //to use for calculating which button is under given page coordinates
            state.topLeftButton = getPageCoords(buttons[0], true);
        }
    }
    //moving finger to other buttons highlight them instead
    function handleTouchMove(e){
        if( state.isFocused && state.focusType === 'touch'){
            var touch = e.changedTouches[0];
            //if touch that has moved is the active touch
            if (touch.identifier === state.touchId){
                var coords = state.buttonCoords;
                //if the touch was not previously on a button
                if (state.touchedButton === null){
                    //see if the touch is currently on a button
                    state.touchedButton = getButtonFromCoords(touch.pageX, touch.pageY);
                    if( state.touchedButton !== null){
                        state.touchedButton.classList.add('focused');
                        state.buttonCoords = getPageCoords(state.touchedButton);
                    }
                    else{
                        state.buttonCoords = null;
                    }
                }
                //if the touch has exited the boundaries of the previously touched button
                else if( touch.pageY < coords.top || touch.pageY > coords.bottom ||
                touch.pageX < coords.left || touch.pageX > coords.right ){
                    state.touchedButton.classList.remove('focused');
                    //see if it's on a different button
                    state.touchedButton = getButtonFromCoords(touch.pageX, touch.pageY);
                    if( state.touchedButton !== null){
                        state.touchedButton.classList.add('focused');
                        state.buttonCoords = getPageCoords(state.touchedButton);
                    }
                    else{
                        state.buttonCoords = null;
                    }
                }
            }
        }
    }
    //lifting finger triggers button that finger is on 
    function handleTouchEnd(e){
        if( state.isFocused && state.focusType === 'touch'){
            var touch = e.changedTouches[0];
            //if the touch is the active touch
            if (touch.identifier === state.touchId){
                //if the touch was on a button, perform the action for that button
                if (state.touchedButton !== null){
                    state.touchedButton.classList.remove('focused');
                    useButton(state.touchedButton);
                }
                state.isFocused = false;
                state.focusType = null;
                state.touchId = null;
                state.touchedButton = null;
                state.buttonCoords = null;
                state.topLeftButton = null;
            }
        }
    }
    //for touch cancel, remove focus style but don't perform button action 
    function handleTouchCancel(e){
        if( state.isFocused && state.focusType === 'touch'){
            var touch = e.changedTouches[0];
            if (touch.identifier === state.touchId){
                if (state.touchedButton !== null){
                    state.touchedButton.classList.remove('focused');
                }
                state.isFocused = false;
                state.focusType = null;
                state.touchId = null;
                state.touchedButton = null;
                state.buttonCoords = null;
                state.topLeftButton = null;
            }
        }
    }
    addListenerToList(buttons, ['touchstart'], handleTouchStart);
    calculator.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchCancel);

    //returns an object containing coordinates for a given HTML element.
    //returnWandH indicates whether or not we need to add the width and 
    //height of the element as properties on the returned object
    function getPageCoords(element, returnWandH){
        var vpCoords = element.getBoundingClientRect();
        var pageCoords = {};
        pageCoords.top = vpCoords.top + pageYOffset;
        pageCoords.bottom = vpCoords.bottom + pageYOffset;
        pageCoords.left = vpCoords.left + pageXOffset;
        pageCoords.right = vpCoords.right + pageXOffset;
        if(returnWandH === true){
            pageCoords.width = vpCoords.width;
            pageCoords.height = vpCoords.height;
        }
        return pageCoords;
    }

    //returns currently touched button from provided page coordinates
    function getButtonFromCoords(x, y){
        var coords = state.topLeftButton;
        var row = Math.floor((y - coords.top) / coords.height);
        var column = Math.floor((x - coords.left) / coords.width); 
        //if coordinates are outside the container of buttons 
        if( row < 0 || row > 4 || column < 0 || column > 3){
            return null;
        }
        var index = row * 4 + column;
        //because the 0 button is double wide and at index 16
        if (index >= 17){
            index -= 1;
        }
        return buttons[index];
    }



    /*****************
        Calculator
    ******************/
    function useButton(button){
        switch(button.dataset.btnType){
            case 'number':
                useNumber(button.dataset.btnValue);
                break;
            case 'operator': 
                useOperator(button.dataset.btnValue);
                break;
            case 'decimal':
                useDecimal();
                break;
            case 'clear':
                useClear();
                break;
            case 'negative':
                useNegative();
                break;
            case 'percent':
                usePercent();
                break;
            case 'equals':
                useEquals();
                break;
            default:
                throw new Error('Bad value for data-btn-type.');
        }
    }

    function useNumber(num){
        //if the calculator is expecting a new number
        //e.g. after clearing or clicking an operator button
        if (state.newInput){
            state.displayType = 'input';

            //using the number 0 doesn't change the clear button from AC to C
            if (num !== '0'){
                state.newInput = false;
                setClear('display');
            }
            //examples: press +/- then 0;
            // 3 + = C = 0;
            // ÷ = 0
            //unless the current display value is not 0 or is negative 0
            else if(state.isNegative || num !== state.displayValue.toString()){
                setClear('display');
            }

            //reset the input array and length to contain only the given digit
            state.input = [num];
            state.inputLength = 1;
            if (state.currentOperator !== null){
                deactivateOperator();
            }
            updateInputValue();
        }
        //otherwise, if the length of the currently input number isn't at
        //the maximum number of digits (9)
        else if (state.inputLength < 9){
            state.input.push(num);
            state.inputLength += 1;
            updateInputValue();
        }
    }

    function useDecimal(){
        if (state.newInput){
            state.input = ['0', '.'];
            state.inputLength = 1;
            state.newInput = false;
            state.isDecimal = true;
            setClear('display');
            if (state.currentOperator !== null){
                deactivateOperator();
            }
            updateInputValue();
        }
        else if (state.inputLength < 9 && !state.isDecimal){
            state.input.push('.');
            state.isDecimal = true;
            updateInputValue();
        }
    }

    function useNegative(){
        if (state.displayType === 'input'){
            state.isNegative = !state.isNegative;
            updateInputValue();
        }
        else if (state.operatorActive || state.displayValue === 'Error'){
            state.displayType = 'input';
            state.isNegative = !state.isNegative;
            updateInputValue();
        }
        else if (state.displayValue === 0){
            if (state.zeroNegative){
                updateDisplayValue('0');
                state.zeroNegative = false;
            }
            else{
                updateDisplayValue('-0');
                state.zeroNegative = true;
            }
        }
        else {
            var val = -state.displayValue;
            inputEvaluated();
            updateResultValue(val);
        }
    }

    function usePercent(){
        if ((state.displayType === 'input' || state.operatorActive) && (
            state.currentOperator === 'add' || state.currentOperator === 'subtract')
            ){
            var val = state.displayValue * state.currentValue / 100;
        }
        else{ 
            val = state.displayValue / 100;
        }
        inputEvaluated();
        updateResultValue(val);
    }

    function useClear(){
        if (state.clearType === 'all'){ 
            if (state.currentOperator !== null){
                deactivateOperator();
            }
            state.currentValue= null;
            state.currentOperator= null;
            state.storedValue= null;
            state.storedOperator= null;
            state.chainEquals = false;
        }
        else if (state.currentOperator !== null && state.chainEquals === false){
            activateOperator();
        }
        state.input = [0];
        state.inputLength = 1;
        state.displayValue = 0;
        state.displayType = 'input';
        state.isDecimal = false;
        state.isNegative = false;
        state.newInput = true;
        state.zeroNegative = false;
        updateInputValue();
        setClear('all');
    }

    function useOperator(type){
        if (state.currentOperator === null || state.chainEquals){
            state.currentOperator = type;
            state.currentValue = state.displayValue;
            inputEvaluated();
            activateOperator();
        }
        else if (state.operatorActive){
            //if changing from multiply to add with a stored value
            if (state.storedValue !== null && (type === 'add' || type === 'subtract')){
                var result = operate(state.storedValue, state.storedOperator, state.currentValue);
                state.storedValue = null;
                state.storedOperator = null;
                updateResultValue(result);
                state.currentValue = result;
                inputEvaluated();

            }
            deactivateOperator();
            state.currentOperator = type;
            activateOperator();
            
        }
        else{
            if (type === 'add' || type === 'subtract'){
                if (state.storedValue !== null){
                    var result = operate(state.currentValue, state.currentOperator, state.displayValue);
                    result = operate(state.storedValue, state.storedOperator, result);
                    state.storedValue = null;
                    state.storedOperator = null;

                    //function this VV
                    updateResultValue(result);
                    state.currentOperator = type;
                    state.currentValue = result;
                    inputEvaluated();
                    activateOperator();

                }
                else{
                    var result = operate(state.currentValue, state.currentOperator, state.displayValue);

                    //function this VV
                    updateResultValue(result);
                    state.currentOperator = type;
                    state.currentValue = result;
                    inputEvaluated();
                    activateOperator();
                }
            }
            else{
                if (state.currentOperator === 'add' || state.currentOperator === 'subtract'){
                    state.storedValue = state.currentValue;
                    state.storedOperator = state.currentOperator;
                    state.currentOperator = type;
                    state.currentValue = state.displayValue;
                    inputEvaluated();
                    activateOperator();
                }
                else{
                    var result = operate(state.currentValue, state.currentOperator, state.displayValue);

                    //function this VV
                    updateResultValue(result);
                    state.currentOperator = type;
                    state.currentValue = result;
                    inputEvaluated();
                    activateOperator();
                }
            }
        }
        state.chainEquals = false;
    }

    function useEquals(){
        if (state.storedValue !== null){
            var result = operate(state.currentValue, state.currentOperator, state.displayValue);
            result = operate(state.storedValue, state.storedOperator, result);
            state.storedValue = null;
            state.storedOperator = null;
            state.currentValue = state.displayValue;

            //function this VV
            updateResultValue(result);
            inputEvaluated();
            deactivateOperator();
            state.chainEquals = true;
        }
        else if (state.currentValue !== null) {
            if (!state.chainEquals){
                var result = operate(state.currentValue, state.currentOperator, state.displayValue);
                state.currentValue = state.displayValue;
            }
            else{
                var result = operate(state.displayValue, state.currentOperator, state.currentValue);
            }

            //function this VV
            updateResultValue(result);
            inputEvaluated();
            deactivateOperator();
            state.chainEquals = true;
        }
    }

    //sets display value to given value
    //processes value to display properly on screen
    //i.e. removes trailing zeros, adds commas, etc. when necessary
    function updateResultValue(val){
        state.displayValue = val;
        //err when value is NaN, 'Error', or very small/large (magnitude 10^[<-100 or >160])
        if (
            val !== val || val === 'Error' || val >= 1e161 || val <= -1e161 || 
            val < 1e-100 && val > 0 || val > -1e-100 && val <0
            ){
            val = 'Error';
            state.displayValue = val;
        }
        //use scientific notation with large (10^[>9]) and small (10^[<-8]) values
        else if (
                  val >= 1e9 || val <= -1e9 ||
                    val < 9.99999999e-9 && val > 0 || val > -9.99999999e-9 && val < 0
                  ){
            val = val.toExponential().split('');
            var digit = val.splice(0, val.indexOf('e') );
            var exponent = val.splice(1);
            var tempDigit = Number(digit.join('')).toFixed(8 - exponent.length);
            if( Number(tempDigit) >= 10 ){
                digit = (Number(digit.join(''))/10).toFixed(8 - exponent.length);
                digit = digit.replace(/\.?0+$/,"");
                exponent = (parseInt(exponent.join('')) + 1).toString();
                val = digit + 'e' + exponent;
            }
            else{
                digit = Number(digit.join('')).toFixed(8 - exponent.length);
                digit = digit.replace(/\.?0+$/,"");
                exponent = parseInt(exponent.join('')).toString();
                val = digit + 'e' + exponent;
            }
        }
        else{
            var decimal = val.toFixed(11).split('').indexOf('.');
            if (decimal > 8){ 
                val = val.toFixed(0);
            }
            else{
                val = val.toFixed(9 - decimal).replace(/\.?0+$/,"");
            }
            val = addCommas(val.split(''));
        }
        state.zeroNegative = false;
        updateDisplayValue(val);
    }

    //sets display value on state and processes value to display on screen
    //i.e. adds commas where necessary 
    function updateInputValue(){
        var val = state.input.slice(0); //clone input
        if (state.isNegative){
            val.unshift('-');
        }
        state.displayValue = Number( val.join(''));
        val = addCommas(val);
        updateDisplayValue(val);
    }

    //takes array representation of a number and inserts commas where appropriate
    // returns number as string
    function addCommas(val){
        var newVal = val.slice(0); //clone array
        var decimal = newVal.indexOf('.');
        if ( decimal === -1 ){
            max = newVal.length;
        }
        else{
            max = decimal;
        }

        if ( newVal.indexOf('-') === -1 ){
            var min = 0;
        }
        else{
            var min = 1;
        }

        for (i = max - 3; i > min; i -= 3){
            newVal.splice(i, 0, ',');
        }
        return newVal.join('');

    }

    function operate(a, operator, b){
        if (a === 'Error' || b === 'Error'){
            return 'Error';
        }
        switch(operator){
            case 'add':
                return a + b;
            case 'subtract':
                return a - b;
            case 'multiply':
                return a * b;
            case 'divide':
                return a / b;
        }
    }

    //resets some state variables when the user's input has been used
    //and the display value is now a result
    //allows user to press number buttons for fresh input
    function inputEvaluated(){
        state.input = [0];
        state.inputLength = 1;
        state.displayType = 'result';
        state.isDecimal = false;
        state.isNegative = false; 
        state.newInput = true;
    }

    //set state and update UI when an operator becomes selected/unselected
    function activateOperator(){
        state.operatorActive = true;
        operators[state.currentOperator].classList.add('selected');
    }
    function deactivateOperator(){
        state.operatorActive = false;
        operators[state.currentOperator].classList.remove('selected');
    }

    //set state and update UI when changing between clear display/all
    function setClear(type){
        if (type !== 'display' && type !== 'all'){
            throw new Error('Invalid value for clear: ' + type);
        }
        if( type !== state.clearType){
            state.clearType = type;
            updateClearButton(type);
        }
    }
    function updateClearButton(type){
        if (type === 'all'){
            clear.innerText = 'AC';
        }
        else{
            clear.innerText = 'C';
        }
    }

    //sends val to UI result window element 
    function updateDisplayValue(val){
        display.innerText = val;
    }


})();

