# Random YouTube Comment Generator
[Live Link](https://ivthefourth.github.io/fcc/front-end/quote-machine/)

## About
Uses the [Google API for YouTube (v3)](https://developers.google.com/youtube/v3/getting-started) to display random YouTube comments. You can view a given comment on YouTube by following a link, or tweet a link to this page that will display the given comment. 

### How It Works
Once the YouTube API is loaded, a request will be sent to get the available video categories for the YouTube charts. If a query string is present with a **cid** parameter, a request will be sent to try to load the given comment. **[Click here for an example](https://ivthefourth.github.io/fcc/front-end/quote-machine/?cid=z231dfdacnbgzf3k4acdp43bheiiq0pmhm5pilflf3pw03c010c)**

When a user clicks the "New" button, a random comment will be picked from a random video in a random category, and then it will be displayed. The videos provided are from the trending videos for a given category. Unless the requests have already been made and data stored, one request will be sent to get the videos from a category, and another to get the comments from a video. 

Data is stored from each request, so if the same category is picked twice, a duplicate request is not sent. This is also the case when the same video is picked twice, however, if all comments have been displayed for that video, a request will be sent to load more. 
