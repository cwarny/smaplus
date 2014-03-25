import pymongo
import twitter
import sys
import time
from urllib2 import URLError

def oauth_login():
    CONSUMER_KEY = 'ZSQCknnf5fXbnF8xvj5PmQ'
    CONSUMER_SECRET = 'MtBrBUJR1kijGAiQLRfOclmEQ9JdDphH2aMB3xtT6g'
    OAUTH_TOKEN = '347348265-hkdqdSxQHppceJIELJoTNcW3l1SbKA60SRkWPPjL'
    OAUTH_TOKEN_SECRET = 'D1wgG5MUROZYQtPRZK2gYwzFcaZl61a93XfRVfdfc'
    
    auth = twitter.oauth.OAuth(OAUTH_TOKEN,OAUTH_TOKEN_SECRET,CONSUMER_KEY,CONSUMER_SECRET)
    return twitter.Twitter(auth=auth)

def make_twitter_request(twitter_api_func, max_errors=3, *args, **kw): 
    
    # A nested helper function that handles common HTTPErrors. Return an updated value 
    # for wait_period if the problem is a 503 error. Block until the rate limit is reset if
    # a rate limiting issue
    def handle_twitter_http_error(e, wait_period=2, sleep_when_rate_limited=True):
    
        if wait_period > 3600: # Seconds
            print >> sys.stderr, 'Too many retries. Quitting.'
            raise e
    
        # See https://dev.twitter.com/docs/error-codes-responses for common codes
    
        if e.e.code == 401:
            print >> sys.stderr, 'Encountered 401 Error (Not Authorized)'
            return None
        elif e.e.code == 429: 
            print >> sys.stderr, 'Encountered 429 Error (Rate Limit Exceeded)'
            if sleep_when_rate_limited:
                print >> sys.stderr, "Sleeping for 15 minutes, and then I'll try again...ZzZ..."
                sys.stderr.flush()
                time.sleep(60*15 + 5)
                print >> sys.stderr, '...ZzZ...Awake now and trying again.'
                return 2
            else:
                raise e # Allow user to handle the rate limiting issue however they'd like 
        elif e.e.code in (502, 503):
            print >> sys.stderr, 'Encountered %i Error. Will retry in %i seconds' % (e.e.code,wait_period)
            time.sleep(wait_period)
            wait_period *= 1.5
            return wait_period
        else:
            raise e

    # End of nested helper function
    
    wait_period = 2 
    error_count = 0 

    while True:
        try:
            return twitter_api_func(*args, **kw)
        except twitter.api.TwitterHTTPError, e:
            error_count = 0 
            wait_period = handle_twitter_http_error(e, wait_period)
            if wait_period is None:
                return
        except URLError, e:
            error_count += 1
            print >> sys.stderr, "URLError encountered. Continuing."
            if error_count > max_errors:
                print >> sys.stderr, "Too many consecutive errors...bailing out."
                raise

def twitter_search(twitter_api,q,max_statuses=200,**kw):
    search_results = make_twitter_request(twitter_api.search.tweets,q=q,count=100) # Twitter enforces a maximum of 100 results per page
    statuses = search_results['statuses']
    max_statuses = min(1000,max_statuses)
    while len(statuses) < max_statuses and search_results["statuses"]: # Paginate through results as long as there are results or until we hit max_statuses
        # To get the next page of results, extract the "next results" page ID from the current results page, and use it in a new search
        try:
            next_results = search_results['search_metadata']['next_results']
        except KeyError, e:
            break
        kwargs = dict([kv.split('=') for kv in next_results[1:].split("&")])
        search_results = make_twitter_request(twitter_api.search.tweets,**kwargs)
        statuses += search_results['statuses']
        
    return statuses

def save_to_mongo(data, mongo_db, mongo_db_coll, **mongo_conn_kw):
    
    # Connects to the MongoDB server running on 
    # localhost:27017 by default
    
    client = pymongo.MongoClient(**mongo_conn_kw)
    
    # Get a reference to a particular database
    
    db = client[mongo_db]
    
    # Reference a particular collection in the database
    
    coll = db[mongo_db_coll]
    
    # Perform a bulk insert and  return the IDs
    
    return coll.insert(data)

twitter_api = oauth_login()

twitter_stream = twitter.TwitterStream(auth=twitter_api.auth)

q = 'bieber'

stream = twitter_stream.statuses.filter(track=q)

for tweet in stream:
    save_to_mongo(tweet, 'tweets', q)