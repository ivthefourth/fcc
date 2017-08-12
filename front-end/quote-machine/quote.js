
/************\
     Data     
\************/

var collectedData = {
   //stores data from received from api so that we aren't 
   //making duplicate api requests with the same parameters
   categories: {
      list: [],
      loaded: false,
   },

   //information about the currently displayed comment
   //used for creating links to a comment and to tweet 
   currentCategory: null,
   currentVideo: null,
   currentComment: null,

   //are we waiting for api requests to come back?
   //or for the page to load?
   currentlyLoading: true,
   //has the clent loaded?
   clientLoaded: false,
   //has the ajax request for the youtube api library completed?
   youtubeApiLoaded: false,
};


/*
example snapshot of data structure for collectedData.categories:

{
   loaded: true,                    
   list: [categoryID1, categoryID2],
   categoryID1: {
      loaded: false,
      list: []
   },
   categoryID2: {
      loaded: true,
      list: [{ id: videoID1 }, { id: videoID2 }],
      videoID1: {
         loaded: false,
         list: []
      }
      videoID2: {
         loaded: true,
         list: [commentObject, commentObject, ...],
         next: <string for api request to get more comments for this video>
      }
   }
}

*/


/***********\
     DOM     
\***********/

//store DOM elements to update or add event listeners to
var tweetBtn = document.getElementById('tweet');
var newQuoteBtn = document.getElementById('new-quote');
var loadIcon = document.getElementById('load-icon');
var commentP = document.getElementById('quote');

newQuoteBtn.onclick =  function newQuote(e){
   e.preventDefault();
   //if we aren't waiting for an api request, display a new
   //comment (making a new api request if necessary)
   if ( !collectedData.currentlyLoading ){
      getQuote();
   }
};




/******************\
  Helper Functions    
\******************/

var cheeky = 'Why are you trying to tweet this? You know that was an error message and not a comment, right?'
var errorIcon = '<i class="fa fa-exclamation-triangle"></i> ';

//creates a url to this page that will load 
//displaying the currently displayed comment 
function makeUrl(){
   var url = location.origin + location.pathname +
           '?cid=' + collectedData.currentComment;
   return url;
}


//returns a random array index for an array with a length of 'max'
function randInt(max) {
   return Math.floor( Math.random() * (max));
}

//sets the link on the tweet button to send the user to twitter with the
//intent to post a link to this page that will display the current comment
function setTweet(text){
   tweetBtn.setAttribute('href', ('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text)));

}

//when there is an error (not connection error) with the api request 
function commentError(){
   collectedData.currentlyLoading = false;
   commentP.innerHTML = errorIcon + 'Failed to retrieve comment. Please try again.';
   doneLoading('error');
   setTweet(cheeky);
}

//when there seems to be no internet connection 
function noConnectionError(canTryAgain){
   commentP.innerHTML = errorIcon + 'Cannot find internet connection.';
   doneLoading('error');   
   setTweet(cheeky);

   //sending false to this function means we don't want the user to be able to 
   //load a new comment, so we set collected.Data.currentlyLoading as its opposite, 
   //sending false prevents them from invoking the getQuote function in the click callback
   //sending true allows the getQuote function to run in the click callback
   collectedData.currentlyLoading = !canTryAgain;
}

//when the api request is successful
function displayComment(commentText){
   collectedData.currentlyLoading = false;
   //display the comment text with a link to the actual comment on YouTube 
   var html = commentText + ' <span><a href="https://www.youtube.com/watch?v=' + 
            collectedData.currentVideo + '&lc=' + 
            collectedData.currentComment + '" rel="nofollow" target="_blank">View on YouTube</a></span>';
   commentP.innerHTML = html;
   doneLoading('ok');

   //update tweet button link
   setTweet(makeUrl());
}

//when an api request comes back with or without error
//status should be 'error' or 'ok'
function doneLoading(status){
   if(status === 'error'){
      commentP.classList.add('error')
   }
   commentP.classList.remove('loading');
   loadIcon.classList.remove('animate-loader');
}


//This is used to remove a certain video from our data
//when the comments for that video have all been displayed
//
//in such case, destination would be collectedData.categories[categoryID]
//the object containing the video id is removed from the 
//collectedData.categories[categoryID].list array,
//and then the object for that video's comments is removed from 
//collectedData.categories[categoryID]
//
//It can also be used to remove an entire category from collectedData.categories
//
//see "example snapshot of data structure for collectedData.categories:" above 
function removeIndex(destination, index){
   var arr = destination.list.splice(index, 1);
   delete destination[arr[0].id];
}



/*************\
   API Stuff    
\*************/
//
//At Page Load
//
//when the page is loaded, get the youtube client api
function onClientLoad() {
   collectedData.clientLoaded = true;
   gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
}
//callback for when the youtube api is loaded
function onYouTubeApiLoad() {
   collectedData.youtubeApiLoaded = true;
   gapi.client.setApiKey('AIzaSyA6S05idU4SdBSFc3F3lWfkwsGX7kfSa0c');

   //if url has a querystring with comment id parameter...
   var cid = location.search.match(/cid=[^&]+/);
   if( cid ){
      //load the comment for given id
      getCommentFromSearch(cid[0].slice(4));
      //and load available video categories from YouTube api, but don't
      //update text when they are loaded (keep the comment there)
      getCategories(false);
   }
   //otherwise, just load video cateogires and do update text when loaded
   else{
      getCategories(true);
   }
}

//gets a comment for the video and comment ids provided in url querystring 
function getCommentFromSearch(cid){
   //store comment id
   collectedData.currentComment = cid;

   //create and send api request for this comment
   var request = gapi.client.youtube.commentThreads.list({
      part: 'snippet',
      id: cid,
      textFormat: 'plaintext',
   });
   request.execute( function(response){
      //if network error, let user know with the option to try loading new comments
      if( response.code == -1 ){
         noConnectionError(true);
      }
      //otherwise, continue
      else{
         var text;
         //if the request returned with a valid comment
         if( response.items.length > 0){
            //store the video id for that comment
            collectedData.currentVideo = response.items[0].snippet.videoId;

            //get the text from that comment and display it to user
            text = response.items[0].snippet.topLevelComment.snippet.textDisplay;
            displayComment(text);
         }
         //otherwise display that there was an error getting the comment 
         else{
            commentError();
         }
      }
   });
}

//gets valid video categories from YouTube
function getCategories(setText){
   var request = gapi.client.youtube.videoCategories.list({
      part: 'snippet',
      regionCode: 'US',
   });
   request.execute( function(response){
      //if network error, let user know without the option to try loading 
      //new comments, because we have no categories to choose from 
      if( response.code == -1 ){
         noConnectionError(false);
      }
      //otherwise, continue
      else{
         //if setText argument is true, then display the default text to the user
         //once the categories are loaded 
         if( setText ){
            commentP.textContent = 'Read random comments from YouTube. Click the "New" button to get started!';
            commentP.classList.remove('loading');
            loadIcon.classList.remove('animate-loader');
            collectedData.currentlyLoading = false;
         }

         //loop through the returned categories 
         for (var i=0; i<response.items.length ; i++){
            //categories without assignable as true, won't have any videos,
            //so for categories that are 'assignable'
            if (response.items[i].snippet.assignable === true){
               //store category id in 'list' array
               collectedData.categories.list.push(response.items[i]);
               //create object property for category id, and populate it with
               //default 'unloaded' object
               //this will hold videos for this category in future
               collectedData.categories[response.items[i].id] = {list: [], loaded: false};
            }
         }
         //store the fact that the categories have been loaded
         collectedData.categories.loaded = true;
      }
   });
}

//
//From User Input
//

//start the process of getting a new youtube comment 
function getQuote(){
   //set state to loading and update display 
   collectedData.currentlyLoading = true;
   loadIcon.classList.add('animate-loader');
   commentP.classList.add('loading')
   commentP.classList.remove('error');
   //get list of videos for random category 
   getVideosByPopular();
}

//get list of videos for a random category
//(either from youtube or from stored data)
function getVideosByPopular(){
   //pick a random category ID, from the list of IDs
   var index = randInt(collectedData.categories.list.length);
   var categoryId = collectedData.currentCategory = collectedData.categories.list[index].id;

   //if we've already loaded videos for that category, no need for api call
   if( collectedData.categories[categoryId].loaded ){
      //get list of comments for random video in given category
      getCommentThread();
   }
   //otherwise we need to get the videos for this category from YouTube api 
   else{
      var request = gapi.client.youtube.videos.list({
          part: 'id',
          chart: 'mostPopular',
          videoCategoryId: categoryId,
          maxResults: 50,

      });
      request.execute( function(response){
         //if network error, let user know with the option to try loading new comments
         if( response.code == -1 ){
            noConnectionError(true);
         }
         //otherwise, continue
         else{
            //if the response returns with videos for given category...
            if (response.items && response.items.length >= 1){
               //loop through the returned videos
               for (var i = 0; i < response.items.length; i++){
                  //push object containing video id into given category's list array
                  collectedData.categories[categoryId].list.push(response.items[i]);
                  //create object property for category id, and populate it with
                  //default 'unloaded' object
                  //this will hold comments for this video in future
                  collectedData.categories[categoryId][response.items[i].id] = {list: [], loaded: false};
               }
               //store the fact that the videos have been loaded for given category
               collectedData.categories[categoryId].loaded = true;
               //get list of comments for random video from this response 
               getCommentThread();
            }
            //otherwise
            else{
               //, remove this category from our category list, since there are no videos 
               //(or none left) and... 
               removeIndex(collectedData.categories, index);
               //invoke this function again. should not recursively loop forever, since we remove
               //any categories that do not have videos 
               getVideosByPopular();
            }
         }
      });
   }
}

//get list of comments for a random video from video list
//(either from youtube or from stored data)
function getCommentThread(next){
   //the next parameter indicates that we have gone through all the comments
   //we've loaded for the current video. This means we want to load more results
   //for the comments of a certain video, if there are any. 

   //if next argument is not provided, select a random video for the current video category
   if( next === undefined){
      var categoryId = collectedData.currentCategory;
      var index = randInt(collectedData.categories[categoryId].list.length);
      var vidId = collectedData.currentVideo = collectedData.categories[categoryId].list[index].id;
   }
   //otherwise we want to use the current video in our request
   else{
      var vidId = collectedData.currentVideo;
      var categoryId = collectedData.currentCategory;
   }

   //if we've already loaded comments for this video and don't need to load more,
   //select a random comment
   if( collectedData.categories[categoryId][vidId].loaded && next === undefined){
      getComment();
   }
   //otherwise, if we wanted to load more comments for a certain video but there are none,
   //reset the object for that video in our data. This allows us to load comments for
   //this video again, since there may be new ones by now
   else if( next === 'none'){
      collectedData.categories[categoryId][vidId].loaded = false;
      collectedData.categories[categoryId][vidId].next = undefined;
      //we still want to display a comment, so go get a random video again
      getVideosByPopular();
   }
   //if we haven't loaded comments for this video or we have, but we want to load more
   //(and there are more), we need to do an API request 
   else{
      var reqObj = {
         part: 'snippet',
         maxResults: 100,
         videoId: vidId,
         textFormat: 'plaintext',
      };

      //if we are loading more comments, add the give next parameter to our request
      if( next !== undefined ){
         reqObj.pageToken = next;   
      }

      var request = gapi.client.youtube.commentThreads.list(reqObj);
      request.execute( function(response){
         //if network error, let user know with the option to try loading new comments
         if( response.code == -1 ){
            noConnectionError(true);
         }
         //otherwise, continue
         else{
            //if response returns comments for current video, 
            if (response.items && response.items.length >= 1){
               //store data for comments and indicate that they have been loaded
               for (var i = 0; i < response.items.length; i++){
                  collectedData.categories[categoryId][vidId].list.push(response.items[i]);
               }
               collectedData.categories[categoryId][vidId].loaded = true;

               //if the repsonse suggests there are more comments to load, store the 'next'
               //value for future requests, otherwise there are no more to load, so store 'none'
               collectedData.categories[categoryId][vidId].next = response.nextPageToken || 'none';
               //select random comment from returned comments
               getComment();
            }
            //otherwise, if we had previously loaded comments for this video,
            //reset its data object so we can load fresh comments in the future
            //(there might be new ones)
            //alternative option to consider would be to remove this video from our data
            //in the same way as we do for a video with no comments
            else if ( collectedData.categories[categoryId][vidId].loaded ){
               collectedData.categories[categoryId][vidId].loaded = false;
               collectedData.categories[categoryId][vidId].next = undefined;
               commentError();
            }
            //otherwise the video has no comments at all
            //thus it's probably not very popular and won't get many/any new comments
            //so remove it from our data and try getting a comment from a different video
            else{
               removeIndex(collectedData.categories[categoryId], index);
               getVideosByPopular();
            }
         }
      });
   }
}

//get random comment from current video data
function getComment(){
   var categoryId = collectedData.currentCategory;
   var vidId = collectedData.currentVideo;
   var commentArr = collectedData.categories[categoryId][vidId].list;
   //if there are no comments left for current video, send an api request to get more comments
   if (commentArr.length < 1){
      getCommentThread(collectedData.categories[categoryId][vidId].next);
   }
   //otherwise, get a random comment 
   else{
      var index = randInt(commentArr.length);
      var text = commentArr[index].snippet.topLevelComment.snippet.textDisplay;
      collectedData.currentComment = commentArr[index].id;

      //display comment as long as it has a snippet
      //if there's no snippet, show a comment error.
      if (text){
         displayComment(text);
      }
      else{
         commentError();
      }
      //remove comment from stored data 
      commentArr.splice(index, 1);
   }
}





