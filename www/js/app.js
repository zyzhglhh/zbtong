// Ionic Starter App
var dependencies = ['ionic',
                    'w5c.validator',
                    'angular-jwt',
                    'monospaced.qrcode',
                    'btford.socket-io',
                    'ngCordova',
                    'yiyangbao.services',
                    'yiyangbao.directives',
                    'yiyangbao.filters',
                    'yiyangbao.controllers',
                    'yiyangbao.controllers.user',
                    'yiyangbao.controllers.backend',
                    ];
var myAppVersion = '0.0.1';
if (!navigator.connection) {
  var Connection = {
    NONE: false
  };
}
var app = angular.module('yiyangbao', dependencies);
app
.config(['$stateProvider', '$urlRouterProvider', '$urlMatcherFactoryProvider', '$locationProvider', '$provide', 'CONFIG', function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider, $locationProvider, $provide, CONFIG) {
    var ACL = function () {
        /*
        * Method to build a distinct bit mask for each role
        * It starts off with "1" and shifts the bit to the left for each element in the
        * roles array parameter
        */
        function buildRoles (roles) {
            var bitMask = "01";
            var userRoles = {};
            for (var role in roles) {
                var intCode = parseInt(bitMask, 2);
                userRoles[roles[role]] = {
                    bitMask: intCode,
                    title: roles[role]
                };
                bitMask = (intCode << 1 ).toString(2);
            }
            return userRoles;
        }
        /*
        * This method builds access level bit masks based on the accessLevelDeclaration parameter which must
        * contain an array for each access level containing the allowed user roles.
        */
        function buildAccessLevels (accessLevelDeclarations, userRoles) {
            var accessLevels = {}, resultBitMask;
            for (var level in accessLevelDeclarations) {
                if (typeof accessLevelDeclarations[level] == 'string') {
                    if (accessLevelDeclarations[level] == '*') {
                        resultBitMask = '';
                        for (var r in userRoles) {
                            resultBitMask += "1";
                        }
                        accessLevels[level] = {
                            bitMask: parseInt(resultBitMask, 2)
                        };
                    }
                    else console.log("Access Control Error: Could not parse '" + accessLevelDeclarations[level] + "' as access definition for level '" + level + "'");
                }
                else {
                    resultBitMask = 0;
                    for (var role in accessLevelDeclarations[level]) {
                        if (userRoles.hasOwnProperty(accessLevelDeclarations[level][role])) resultBitMask = resultBitMask | userRoles[accessLevelDeclarations[level][role]].bitMask;
                        else console.log("Access Control Error: Could not find role '" + accessLevelDeclarations[level][role] + "' in registered roles while building access for '" + level + "'");
                    }
                    accessLevels[level] = {
                        bitMask: resultBitMask
                    };
                }
            }
            return accessLevels;
        }
        var userRoles = buildRoles(CONFIG.userRoles);
        var accessLevels = buildAccessLevels(CONFIG.accessLevels, userRoles);
        return {
            userRoles: userRoles,
            accessLevels: accessLevels
        };
    };
    var acl = ACL();
    var access = acl.accessLevels;
    $provide.service('ACL', function () { 
        return acl;
    });
    $urlMatcherFactoryProvider.strictMode(false);
    $stateProvider
        .state('intro', {
            url:'/intro',
            templateUrl: 'partials/about/intro.html',
            controller: 'intro',
            data: {
                access: access.public
            }
        });
    $stateProvider
        .state('public', {
            abstract: true,
            templateUrl: 'partials/sideMenuLeft.html',
            controller: 'publicSideMenu',
            data: {
                access: access.public
            }
        })
        .state('public.aboutUs', {
            url: '/aboutUs',
            templateUrl: 'partials/about/aboutUs.html',
            data: {
                menuToggle: true
            },
            controller: 'aboutUs'
        })
        .state('public.agreement', {
            url: '/agreement',
            templateUrl: 'partials/about/agreement.html',
            data: {
                menuToggle: true
            },
            controller: 'agreement'
        })
        .state('public.settings', {
            url: '/settings',
            templateUrl: 'partials/about/settings.html',
            data: {
                menuToggle: true
            },
            controller: 'settings'
        })
        .state('public.feedback', {
            url: '/feedback',
            templateUrl: 'partials/about/feedback.html',
            controller: 'feedback'
        });
    $stateProvider
        .state('user', {
            abstract: true,
            url: '/user',
            templateUrl: 'partials/user/tabsBottom.html',
            controller: 'userTabsBottom',
            data: { 
                access: access.user
            }
        })
        .state('user.home', {
            url: '/home',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/home.html',
                    controller: 'userHome'
                }
            }
        })
        .state('user.apply', {
            url: '/apply',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/apply.html',
                    controller: 'userApply'
                }
            }
        })
        .state('user.ConsList', {
            url: '/ConsList?action',
            views: {
                'userConsList': {
                    templateUrl: 'partials/user/ConsList.html',
                    controller: 'userConsList'
                }
            }
        })
        .state('user.ConsDetail', { 
            url: '/ConsDetail/:consId',
            params: { 
                cons: null,
            },
            views: {
                'userConsList': {
                    templateUrl: 'partials/user/ConsDetail.html',
                    controller: 'userConsDetail'
                }
            }
        })
        .state('user.activities', {
            url: '/activities',
            views: {
                'userActivities': {
                    templateUrl: 'partials/user/activities.html',
                    controller: 'userActivities'
                }
            }
        })

        .state('user.settings', {
            url: '/settings',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/settings.html',
                    controller: 'userSettings'
                }
            }
        })
        .state('user.feedback', {
            url: '/feedback',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/feedback.html',
                    controller: 'userFeedback'
                }
            }
        })
        .state('user.mine', {
            url: '/mine?action',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/mine.html',
                    controller: 'userMine'
                }
            }
        })
        .state('user.yljbalance', {
            url: '/yljbalance',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/yljbalance.html',
                    controller: 'userYljBalanceCtrl'
                }
            }
        })
        .state('user.yibalance', {
            url: '/yibalance',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/yibalance.html',
                    controller: 'userYiBalanceCtrl'
                }
            }
        })
        .state('user.helper', {
            url: '/helper',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/helper.html',
                    controller: 'userHelper'
                }
            }
        })
        .state('user.search', {
            url: '/search',
            views: {
                'userConsList': {
                    templateUrl: 'partials/common/search.html',
                    controller: 'userSearch'
                }
            }
        })
        .state('user.health', {    
            url: '/health',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/health.html',
                    controller: 'userHealth'
                }
            }
        })
        .state('user.onlinecart', {    
            url: '/onlinecart',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/onlinecart.html',
                    controller: 'userOnlinecart'
                }
            }
        })
        .state('user.kenbei', {    
            url: '/kenbei',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/kenbei.html',
                    controller: 'userKenbei'
                }
            }
        })
        .state('user.bxproduct', {    
            url: '/bxproduct',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/bxproduct.html',
                    controller: 'userBxproduct'
                }
            }
        })
        .state('user.myguang', {    
            url: '/myguang',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/myguang.html',
                    controller: 'userMyguang'
                }
            }
        })
        .state('user.yangsheng', {    
            url: '/yangsheng',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/yangsheng.html',
                    controller: 'userYangsheng'
                }
            }
        })
        .state('user.article', {
            url: '/article/:typeid/:id',
            views: {
                'userHome': {
                    templateUrl: 'partials/user/article.html',
                    controller: 'userArticle'
                }
            }
        })
        ;
    $stateProvider
        .state('serv', {
            abstract: true,
            url: '/serv',
            templateUrl: 'partials/backend/serv/tabsBottom.html',
            controller: 'servTabsBottom',
            data: { 
                access: access.serv
            }
        })
        .state('serv.barcode', {
            url: '/barcode:barcode',
            views: {
                'servBarcode': {
                    templateUrl: 'partials/backend/serv/barcode.html',
                    controller: 'servBarcode'
                }
            }
        })
        .state('serv.ConsList', {
            url: '/ConsList',
            views: {
                'servConsList': {
                    templateUrl: 'partials/backend/serv/ConsList.html',
                    controller: 'servConsList'
                }
            }
        })
        .state('serv.ConsDetail', { 
            url: '/ConsDetail/:consId',
            params: { 
                cons: null,
            },
            views: {
                'servConsList': {
                    templateUrl: 'partials/backend/serv/ConsDetail.html',
                    controller: 'servConsDetail'
                }
            }
        })
        .state('serv.home', {
            url: '/home',
            views: {
                'servHome': {
                    templateUrl: 'partials/backend/serv/home.html',
                    controller: 'servHome'
                }
            }
        })
        .state('serv.mine', {
            url: '/mine',
            views: {
                'servHome': {
                    templateUrl: 'partials/backend/serv/mine.html',
                    controller: 'servMine'
                }
            }
        })
        .state('serv.settings', {
            url: '/settings',
            views: {
                'servHome': {
                    templateUrl: 'partials/backend/serv/settings.html',
                    controller: 'servSettings'
                }
            }
        })
        .state('serv.helper', {
            url: '/helper',
            views: {
                'servHome': {
                    templateUrl: 'partials/backend/serv/helper.html',
                    controller: 'servHelper'
                }
            }
        })
        .state('serv.feedback', {
            url: '/feedback',
            views: {
                'servHome': {
                    templateUrl: 'partials/backend/serv/feedback.html',
                    controller: 'servFeedback'
                }
            }
        })
        .state('serv.search', {
            url: '/search',
            views: {
                'servConsList': {
                    templateUrl: 'partials/common/search.html',
                    controller: 'servSearch'
                }
            }
        });
    $stateProvider
        .state('medi', {
            abstract: true,
            url: '/medi',
            templateUrl: 'partials/backend/medi/tabsBottom.html',
            controller: 'mediTabsBottom',
            data: { 
                access: access.medi
            }
        })
        .state('medi.barcode', {
            url: '/barcode',
            views: {
                'mediBarcode': {
                    templateUrl: 'partials/backend/medi/barcode.html',
                    controller: 'mediBarcode'
                }
            }
        })
        .state('medi.ConsList', {
            url: '/ConsList',
            views: {
                'mediConsList': {
                    templateUrl: 'partials/backend/medi/ConsList.html',
                    controller: 'mediConsList'
                }
            }
        })
        .state('medi.ConsDetail', { 
            url: '/ConsDetail/:consId',
            params: { 
                cons: null,
            },
            views: {
                'mediConsList': {
                    templateUrl: 'partials/backend/medi/ConsDetail.html',
                    controller: 'mediConsDetail'
                }
            }
        })
        .state('medi.home', {
            url: '/home',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/home.html',
                    controller: 'mediHome'
                }
            }
        })
        .state('medi.mine', {
            url: '/mine',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/mine.html',
                    controller: 'mediMine'
                }
            }
        })
        .state('medi.settings', {
            url: '/settings',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/settings.html',
                    controller: 'mediSettings'
                }
            }
        })
        .state('medi.helper', {
            url: '/helper',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/helper.html',
                    controller: 'mediHelper'
                }
            }
        })
        .state('medi.feedback', {
            url: '/feedback',
            views: {
                'mediHome': {
                    templateUrl: 'partials/backend/medi/feedback.html',
                    controller: 'mediFeedback'
                }
            }
        })
        .state('medi.search', {
            url: '/search',
            views: {
                'mediConsList': {
                    templateUrl: 'partials/common/search.html',
                    controller: 'mediSearch'
                }
            }
        })
        .state('medi.receipt', {
            url: '/receipt',
            views: {
                'mediReceipt': {
                    templateUrl: 'partials/backend/medi/receipt.html',
                    controller: 'mediReceipt'
                }
            }
        });
}])
.config(['$ionicConfigProvider', function ($ionicConfigProvider) {
  $ionicConfigProvider.views.maxCache(10); 
  $ionicConfigProvider.views.forwardCache(true);
  $ionicConfigProvider.backButton.icon('ion-ios7-arrow-back');
  $ionicConfigProvider.backButton.text('');
  $ionicConfigProvider.backButton.previousTitleText(false); 
  $ionicConfigProvider.tabs.position('bottom');
  $ionicConfigProvider.navBar.alignTitle('center');
}])
.config(['$httpProvider', 'jwtInterceptorProvider', function ($httpProvider, jwtInterceptorProvider) {
    jwtInterceptorProvider.tokenGetter = ['config', 'jwtHelper', '$http', 'CONFIG', 'Storage', function(config, jwtHelper, $http, CONFIG, Storage) {
        var token = Storage.get('token');
        var refreshToken = Storage.get('refreshToken');
        if (!token && !refreshToken) {
            return null;
        }
        var isExpired = true;
        try {
            isExpired = jwtHelper.isTokenExpired(token);
        }
        catch (e) {
            isExpired = true;
        }
        if (config.url.substr(config.url.length - 5) === '.html' || config.url.substr(config.url.length - 3) === '.js' || config.url.substr(config.url.length - 4) === '.css' || config.url.substr(config.url.length - 4) === '.jpg' || config.url.substr(config.url.length - 4) === '.png' || config.url.substr(config.url.length - 4) === '.ico' || config.url.substr(config.url.length - 5) === '.woff') { 
            return null;
        }
        else if (isExpired) {   
            if (refreshToken && refreshToken.length >= 16) { 
                return $http({
                    url: CONFIG.baseUrl + 'refreshToken',
                    skipAuthorization: true,
                    method: 'POST',
                    timeout: 5000,
                    data: { 
                        grant_type: 'refresh_token',
                        refresh_token: refreshToken 
                    }
                }).then(function (res) {
                    Storage.set('token', res.data.token);
                    Storage.set('refreshToken', res.data.refreshToken);
                    return res.data.token;
                }, function (err) {
                    console.log(err);
                    return null;
                });
            }
            else {
                Storage.rm('refreshToken'); 
                return null;
            }  
        } 
        else {
            return token;
        }
    }];
    $httpProvider.interceptors.push('jwtInterceptor');
}])
.config(['w5cValidatorProvider', function (w5cValidatorProvider) {
    w5cValidatorProvider.config({
        blurTrig   : false,
        showError  : true,
        removeError: true
    });
    w5cValidatorProvider.setRules({
        email: { 
            required : "邮箱地址不能为空",
            email    : "输入邮箱的格式不正确"
        },
        username: {
            required : "输入的用户名不能为空",
            pattern  : "用户名只能包含字母, 数字, 下划线"
        },
        password: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        repeatPassword: {
            required : "密码不能为空",
            repeat: "两次填写的密码不一致"
        },
        oldPassword: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        newPassword: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        repeatPwd: {
            required : "密码不能为空",
            repeat: "两次填写的密码不一致"
        },
        oldDealPassword: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        newDealPassword: {
            required : "密码不能为空",
            minlength: "密码长度不能小于{minlength}",
            maxlength: "密码长度不能大于{maxlength}"
        },
        name : {
            required : "姓名不能为空",
            pattern  : "请正确输入中文姓名"
        },
        mobile: {
            required : "手机号不能为空",
            pattern  : "请填写正确手机号",
            minlength: "手机号长度不能小于{minlength}",
            maxlength: "手机号长度不能大于{maxlength}"
        },
        tel: {
            pattern  : "请填写正确电话号",
            minlength: "电话号长度不能小于{minlength}",
            maxlength: "电话号长度不能大于{maxlength}"
        },
        idNo: {
            required : "证件号不能为空",
            pattern  : "请填写正确证件号",
            minlength: "证件号长度不能小于{minlength}",
            maxlength: "证件号长度不能大于{maxlength}"
        },
        money: {
            required : "金额不能为空",
            min: "最小金额0.01元"
        }
    });
}])
.run(['$ionicPlatform', '$rootScope', '$state', 'Storage', 'Token', '$ionicPopup', function ($ionicPlatform, $rootScope, $state, Storage, Token, $ionicPopup) {
  $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if(window.StatusBar) {
            StatusBar.styleDefault();
        }
        if (navigator.connection) {
            $rootScope.myOnline = navigator.connection.type;
        }
        else {
            $rootScope.myOnline = window.navigator.onLine;
        }
        $ionicPlatform.on('online', function () { 
            if (navigator.connection) {
                $rootScope.myOnline = navigator.connection.type;
            }
            else {
                $rootScope.myOnline = window.navigator.onLine;
            }
            $rootScope.$broadcast('onOnline');
        }, false);
        $ionicPlatform.on('offline', function () {
            if (navigator.connection) {
                $rootScope.myOnline = navigator.connection.type;
            }
            else {
                $rootScope.myOnline = window.navigator.onLine;
            }
            $rootScope.$broadcast('onOffline');
        }, false);
        switch (Token.curUserRole()) {
            case 'public':
                $state.go('public.aboutUs');
                break;
            case 'user':
                $state.go('user.home');
                break;
            case 'serv':
                $state.go('serv.home');
                break;
            case 'medi':
                $state.go('medi.home');
                break;
            default:
                $state.go('public.aboutUs');
        }
    });
}])
.run(['$rootScope', '$state', '$ionicHistory', 'Auth', 'ACL', 'Token', 'User', 'Storage', 'PageFunc', function ($rootScope, $state, $ionicHistory, Auth, ACL, Token, User, Storage, PageFunc) {
    $rootScope.$on("$stateChangeStart", function (event, toState, toParams, fromState, fromParams) {
        if (!('data' in toState) || !('access' in toState.data)) {
            event.preventDefault();
            PageFunc.message('当前内容建设中, 敬请期待!', 2000);
            $state.go(fromState.name || 'anon.login');
        }
        else if (Auth.authorize(toState.data.access) && 
                !Auth.isLoggedIn() && 
                !Storage.get('refreshToken') && 
                toState.data.access.bitMask !== ACL.accessLevels.public.bitMask && 
                toState.data.access.bitMask !== ACL.accessLevels.anon.bitMask) {
            event.preventDefault();
            $rootScope.state = {
                toStateName: toState.name,
                fromStateName: fromState.name
            };
            User.loginModal($rootScope);
        }
        else if (!Auth.authorize(toState.data.access)) {
            event.preventDefault(); 
                if (Auth.isLoggedIn()) {
                    PageFunc.message('页面不存在或不能浏览!', 2000);
                    $state.go(fromState.name || 'user.home');
                } 
                else {
                    $rootScope.state = {
                        toStateName: toState.name,
                        fromStateName: fromState.name
                    };
                    User.loginModal($rootScope);
                }
        }
        if (toState.data.menuToggle) {
            $ionicHistory.nextViewOptions({
                disableBack: true
            });
        }
    });
}])
;