// We have FB App IDs based on what environment we are running the app from
// For local we are SOL until we can get a local fake domain

// Force redirect from 127 to localhost
if (window.location.hostname == '127.0.0.1') {
    window.location = 'http://localhost:' + window.location.port
}

var production = 'production';
var development = 'development';
var staging = 'staging';

var environment = production;

// Production
var facebookAppID = '175469245988036';

// // Development
// if (window.location.hostname == 'localhost') {
//     facebookAppID = '458447817605220';
//     environment = development;
// }
//     // Staging?
// else if (window.location.hostname == 'a916c211b13a4344a98980e83a11ef77.cloudapp.net') {
//     facebookAppID = '358940620916752';
//     environment = staging;
// }

function error_view(message) {
    return _.template($('#error-generic-view').html(), { message: message });
}

function progress_view() {
    return _.template($('#progress-generic-view').html());
}


// User model
// -- Will eventually transition to using a User model to handle all
// -- of the session interactions with the server.
var User = Backbone.Model.extend({
    defaults: {
        'session': null,
    },
    authorize: function () {
        var sessionCookie = $.cookie('session');
        if (sessionCookie != null) {
            this.set('session', sessionCookie);
        }

        if (this.logged_in()) {
            $(document).ready(function () {
                $('.account-links').removeClass('hidden');
                $('.guest-links').hide();
            })
        }
    },
    logged_in: function () {
        return this.token() != null;
    },
    token: function () {
        return this.get('session');
    },
    createSession: function (session) {
        this.set('session', session);
        $.cookie('session', session);
        this.authorize();
    },

    // Used to authorize and update access token
    authenticate: function (response, callback) {

        // We can only authenticate if we have a proper auth response
        if (response.authResponse) {

            // grab necessary parameters and send it off
            var accessToken = response.authResponse.accessToken;
            var userID = response.authResponse.userID;

            $.post('/api/authentication/authenticate', { FacebookId: userID, AccessToken: accessToken }, function (resp) {
                currentUser.createSession(resp.SessionToken);
                if (typeof callback == 'function') {
                    callback();
                }
            });
        }
    }
});

var currentUser = new User();
currentUser.authorize();

// Gift Item model
var GiftItem = Backbone.Model.extend({
    defaults: {
        'Name': 'Item Name',
        'Price': '0.00',
        'ProductUrl': 'http://amazon.com',
        'ImageUrl': 'http://placehold.it/200x50',
        'ImageUrlDefault': 'http://placehold.it/200x50',
        'Description': 'Sample description for Item'
    },
});

// Gifts collection model
var Suggestions = Backbone.Collection.extend({
    model: GiftItem,
    url: function () {
        //if (environment == development) {
        //    return '/Scripts/Data/api.suggestions.suggestions.json';
        //}
        return '/api/suggestions/suggestions?sessionToken=' + currentUser.token() + '&id=' + this.friend_id;
    },
    friend_id: 0,
});

// Friend model
var Friend = Backbone.Model.extend({
    url: function () {
        //if (environment == development) {
        //    return '/Scripts/Data/api.friends.single.json';
        //}
        return '/api/friends/friend?sessionToken=' + currentUser.token() + '&id=' + this.get('id');
    }
});

// Friends collection model
var Friends = Backbone.Collection.extend({
    model: Friend,
    url: function () {
        //if (environment == development) {
            //return '/Scripts/Data/api.friends.list.json';
        //}
        return '/api/friends/friends?sessionToken=' + currentUser.token();
    }
});
var SearchFriends = Backbone.Collection.extend({
    model: Friend,
    url: function () {
        return '/api/friends/searchfriends?sessionToken=' + currentUser.token() + '&name=' + $('#search-query').val();
    },
    friend_id: 0,
});

var _friends = new Friends();
var _searchFriends = new SearchFriends();
var _friendSearchQuery;

// #/friend/:id 
var FriendSingleView = Backbone.View.extend({
    el: $('#container-renderer'),
    render: function (id) {

        $('ol.breadcrumb li:not(:first)').remove();
        $('ol.breadcrumb').append('<li><a href="/#friends">Friends</a></li>');

        var that = this;

        var data = {
            items: [],
            friend: false
        }

        var f = new Friend({ id: id }).fetch({
            success: function (friend) {
                data.friend = friend;
                $('ol.breadcrumb').append('<li>' + friend.get('Name') + '</li>')
                $(that.el).html(_.template($('#friend-single-view').html(), data));
                
                var suggestions = new Suggestions();
                suggestions.friend_id = id;

                $('#suggestions-renderer').html(progress_view());

                suggestions.fetch({
                    success: function (suggestions) {


                        // Running a check just to make sure that we are getting results.
                        if (suggestions.length > 0) {
                            $('#suggestions-renderer').html(_.template($('#suggestions-list-view').html(), {
                                suggestions: suggestions.first(50),
                                friend: friend
                            }));
                        } else {
                            $('#suggestions-renderer').html(error_view('Sorry, we dont have enough juicy details for ' + friend.get('Name') + ' to provide suggestions. Try someone else!'));
                        }
                    },
                    error: function () {
                        $('#suggestions-renderer').html(error_view());
                    }
                });
            },
            error: function () {
                $(that.el).html(error_view('Unable to load profile. Please try again!'));
            }
        });
    }
});

// #/friends
var FriendsListView = Backbone.View.extend({
    el: $('#container-renderer'),
    render: function () {

        $('ol.breadcrumb li:not(:first)').remove();
        $('ol.breadcrumb').append('<li class="active">Friends</li>');

        var that = this;

        $(that.el).html(progress_view());

        _friends.fetch({
            success: function (friends) {
                $(that.el).html(_.template($('#friends-list-view').html(), {
                    friends: friends
                }));
            },
            error: function () {
                $(that.el).html(error_view('Unable to find your friends.'))
            }
        });
    }
});

var SearchedFriendListView = Backbone.View.extend({
    el: $('#container-renderer'),
    render: function (query) {

        if (!query) query = false;

        $('#search-query').val(query);
        $('ol.breadcrumb li:not(:first)').remove();
        $('ol.breadcrumb').append('<li class="active">Search: ' + query + '</li>');

        var that = this;

        $(that.el).html(progress_view());

        _searchFriends.fetch({
            success: function (friends) {
                $(that.el).html(_.template($('#friends-list-view').html(), {
                    friends: friends
                }));
            },
            error: function () {
                $(that.el).html(error_view('Unable to find your friends.'))
            }
        });
    }
});

var AccountView = Backbone.View.extend({
    el: $('#container-renderer'),
    render: function () {

        $(this.el).html(_.template($('#account-view').html()));

        $('ol.breadcrumb li:not(:first)').remove();
        $('ol.breadcrumb').append('<li class="active">Account</li>');
    }
});

var HomeView = Backbone.View.extend({
    el: $('#container-renderer'),
    render: function () {

        $('ol.breadcrumb li:not(:first)').remove();
        $(this.el).html(_.template($('#home-view').html()));
    }
})


$(document).ready(function () {

    $(document).fb(facebookAppID);

    $('#search-form').submit(function (e) {
        e.preventDefault();

        var query = $('#search-query').val();
        
        // Give us at least 3 characters so we are not wasting resources
        if (query.length < 3) {
            $('#search-query').focus();
            return false;
        }

        // Let's navigate the query to the proper route
        app_router.navigate("search/" + query, { trigger: true });
    });


    $(document).on('fb:initialized', function () {
        FB.getLoginStatus(function (response) {
            if (response.status == 'connected') {
                // We just got authorized so let's refresh the page
                if (window.location.hash.indexOf('access_token') != -1) {
                    window.location = '/';
                }
            }
        });
        $('.facebook-authorize-button').click(function () {
            FB.getLoginStatus(function (response) {
                // Disable the authorization button
                if (response.status == 'connected') {
                    currentUser.authenticate(response, function () {
                        console.log("User already authorized");
                        $('.facebook-authorize-button').addClass('disabled').html('You have already been authorized!');
                    });
                }
                else if (response.status == 'not authorized') {
                    $('#container-renderer').append(error_view('You have not authorized our application'));
                }
                else {
                    // not logged in
                    console.log("User Not logged in, logging in");
                    var scope = 'user_birthday, friends_birthday'
                        + ', user_interests, friends_interests'
                        + ', user_likes, friends_likes'
                        + ', user_relationships, friends_relationships'
                        + ', user_relationship_details, friends_relationship_details'
                        + ', email, user_friends, friends_location';
                    window.top.location.href = encodeURI("https://www.facebook.com/dialog/oauth?client_id="+facebookAppID+"&redirect_uri="+window.location.protocol+"//"+window.location.hostname+":"+window.location.port+"&response_type=token&scope="+scope);
                }

            });
        });

        return false;
    });
});

function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    console.log('Query variable %s not found', variable);
}

var AppRouter = Backbone.Router.extend({
    routes: {
        'friend/:id': 'friend_single_view',
        'friends': 'friends_list_view',
        'account': 'account_view',
        'search': 'search_list_view',
        'search/:query': 'search_list_view',
        '*actions': 'defaultRoute'
    }
});

var app_router = new AppRouter();

app_router.on('route:friends_list_view', function () {
    var friends_list_view = new FriendsListView();
    friends_list_view.render();
});

app_router.on('route:search_list_view', function (query) {
    var search_list_view = new SearchedFriendListView();
    search_list_view.render(query);
});

app_router.on('route:friend_single_view', function (id) {
    var friend_single_view = new FriendSingleView();
    friend_single_view.render(id);
});

app_router.on('route:account_view', function () {
    var account_view = new AccountView();
    account_view.render();
});

app_router.on('route:defaultRoute', function () {
    if (currentUser.logged_in()) {
        var friends_list_view = new FriendsListView();
        friends_list_view.render();
    } else {
        var home_view = new HomeView();
        home_view.render();
    }
})

// Start Backbone history a necessary step for bookmarkable URL's
Backbone.history.start();

