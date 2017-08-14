/******************\
 Core Functionality
\******************/

//Stores the current search query 
var activeSearch;

//stores the offset for next wiki api call
// (load more results)
var nextOffset;

//takes title of wiki article and returns a
//link to that article on wikipedia 
function titleToUrl(title){
   return 'https://en.wikipedia.org/wiki/' + 
      encodeURIComponent(title.replace(' ', '_'));
}

//takes array of search results (from request) and 
//creates the html to display these results
function resultsToHtml(array){
   var html = '';
   for( var i = 0; i < array.length; i++){
      //create an article within a link (<a>) to the article on wikipedia
      html += '<a href="' + titleToUrl(array[i].title) + '">';
      html += '<article class="search-result">';
      //poplate the artical with its info
      html += '<h2>' + array[i].title + '</h2>';
      html += '<p>' + array[i].snippet + '</p>';
      html += '</article></a>';
   }
   return html;
}

//load more results for current query
function loadMoreResults(){
   //disable the load more button
   document.getElementById('load-more').disabled = true;

   //success callback for ajax request
   var success = function(result){
      //if there was an error from before, hide that error 
      document.getElementById('err-msg').style.display = 'none';

      //if api call returns no results, display that to user
      if( result.query.search.length === 0){
         document.getElementById('results').innerHTML += '<p>No More Results</p>';
      }
      //otherwise...
      else{
         //display results to user
         document.getElementById('results').innerHTML += 
            resultsToHtml(result.query.search);
         //update results offset for next api call
         //and re-enable load more button if the api call says 
         //that there are more results available
         if( result['continue'] ){
            nextOffset = result['continue'].sroffset;
            document.getElementById('load-more').disabled = false;
         }
         //otherwise, tell the user there are no more results 
         //(keep load more button disabled )
         else{
            document.getElementById('results').innerHTML += '<p>No More Results</p>';
         }
      }
   }

   //error callback for ajax request
   var error = function(){
      //tell the user there was an error loading more results
      document.getElementById('err-msg').style.display = 'block';
      //re-enable load more button so user can try again
      document.getElementById('load-more').disabled = false;
   }

   //send request to wiki api
   searchWiki(activeSearch, nextOffset, success, error);
   
}

//start new search with query from search bar
function newSearch(){
   //if search query has changed and is not empty...
   var query = document.getElementById('search-bar').value;
   if( query !== activeSearch && query !== ''){

      //disable the load more button (because it might be
      //enabled from a previous search)
      document.getElementById('load-more').disabled = true;

      //success callback for ajax request
      var success = function(result){
         //store current query so it can be used to load more results
         activeSearch = query;

         //if api call returns no results, display this to user
         if( result.query.search.length === 0){
            document.getElementById('results').innerHTML = '<p>No Results Match Your Search</p>'
         }
         //otherwise display the results to user
         else{
            document.getElementById('results').innerHTML = resultsToHtml(result.query.search);
            //update results offset for next api call
            //and re-enable load more button if the api call says 
            //that there are more results available
            if( result['continue'] ){
               nextOffset = result['continue'].sroffset;
               document.getElementById('load-more').disabled = false;
            }
            //otherwise, tell the user there are no more results 
            //(keep load more button disabled )
            else{
               document.getElementById('results').innerHTML += '<p>No More Results</p>';
            }
         }
      }
      //error callback for ajax request:
      //tell the user there was an error loading more results
      var error = function(){
         document.getElementById('results').innerHTML = 
            'There was an error while attempting your search';
      }

      //send request to wiki api
      searchWiki(query, 0, success, error);
   }
}


//sends api request to wikipedia 
function searchWiki(query, offset, successCallback, errorCallback){
   var request = new XMLHttpRequest();

   //create url for GET request, encode query, which is search query as
   //string, offset is a number representing where to start getting results
   //e.g. if offset is 10, return results starting at result #11
   var url = 'https://en.wikipedia.org/w/api.php' + 
      '?action=query&list=search&srsearch=' + encodeURIComponent(query) +
       '&format=json&origin=*&sroffset=' + offset;
   
   request.open('GET', url, true);

   request.onload = function() {
      //if request status is not an error, call the success callback 
      if (request.status >= 200 && request.status < 400) {
         successCallback(JSON.parse(request.responseText));
      } 
      //otherwise call the error callback 
      else {
         errorCallback();
      }
   };

   request.onerror = function() {
         errorCallback();
   };

   request.send();
}

//callback for keydoown event on searchbar
function searchBar(e){
   //if key pressed is "enter/return" key, start a new search 
   if( e.keyCode == 13){
      e.preventDefault();
      newSearch();
   }  
}

//add event listeners 
document.getElementById('search-bar').addEventListener('keydown', searchBar, false);
document.getElementById('search-button').addEventListener('click', newSearch, false);
document.getElementById('load-more').addEventListener('click', loadMoreResults, false);



/******************\
 Title Hover Effect
\******************/

//store current hue value (to be updated when title is hovered)
var hue = 0;

//animate keeps track of triggers to start and stop the animation
//if animate > 1, animation will be active... 
//hover and focus each add 1, 
//and un-hover and un-focus each subtract 1
var animate = 0;
function animateLinkLetter(){
   if( animate > 0){
      //do animation
      hue = (hue + 1) % 360;
      linkLetter.style.color = 'hsl(' + hue + ', 100%, 50%)';
      //recursively call this function to continue the animation
      requestAnimationFrame(animateLinkLetter);
   }
   else{
      //set color to black (stop animation)
      linkLetter.style.color = 'hsl(' + hue + ', 100%, 0%)';
   }
}

//starts animation as long as animation isn't already going
function startAnimation(){
   if(animate === 0){
      animate += 1;
      animateLinkLetter();
   }
   else{
      animate += 1;
   }
   
}

//reduces animate variable by one, animation 
//will stop on its own if animate is 0
function stopAnimation(){
   animate -= 1;
}

//add event listeners for title effect 
var mainTitle = document.getElementById('main-title');
mainTitle.addEventListener('mouseenter', startAnimation);
mainTitle.addEventListener('mouseleave', stopAnimation);

var linkLetter = document.getElementById('link-letter');
linkLetter.addEventListener('focus', startAnimation);
linkLetter.addEventListener('blur', stopAnimation);
