angular.module('yiyangbao.controllers', [])
    .controller('main', ['$scope', function ($scope) {
    }])
    .controller('intro', ['$scope', 'Storage', function ($scope, Storage) {
      Storage.set('myAppVersion', myAppVersion);
    }])
    .controller('publicSideMenu', ['$scope', '$ionicPopup', 'Storage', 'User', function ($scope, $ionicPopup, Storage, User) {
        $scope.state = {};
        $scope.sideMenu = {
            firstItem: {
                click: function () {
                    if ($scope.loginModal && $scope.actions.showLogin) {
                        $scope.actions.showLogin();
                    }
                    else {
                        User.loginModal($scope);
                    }
                },
                title: '请登录',
                imgSrc: ''
            },
            items: [
                {href: '#/aboutUs', iconClass: 'ion-ios-information-outline', title: '关于我们'},
                {href: '#/agreement', iconClass: 'ion-ios-compose-outline', title: '用户协议'},
                {href: '#/settings', iconClass: 'ion-ios-gear-outline', title: '系统设置'}
            ]
        };
    }])
    .controller('aboutUs', ['$scope', 'User', function ($scope, User) {
        $scope.actions = {
            loginModal: function () {
                if ($scope.loginModal && $scope.actions.showLogin) {
                    $scope.actions.showLogin();
                }
                else {
                    User.loginModal($scope);
                }
            }
        };
    }])
    .controller('agreement', ['$scope', function ($scope) {
    }])
    .controller('settings', ['$scope', '$ionicPopup', 'Storage', 'User', 'CONFIG', 'Data', 'Socket', function ($scope, $ionicPopup, Storage, User, CONFIG, Data, Socket) {
        $scope.userName = "王林";
        $scope.signature = "";
        $scope.data = {};
        $scope.actions = {
            clearCache: function () {
                var token = Storage.get('token') || '';
                var refreshToken = Storage.get('refreshToken') || '';
                var myAppVersionLocal = Storage.get('myAppVersion') || '';
                Storage.clear();
                if (token) Storage.set('token', token);
                if (refreshToken) Storage.set('refreshToken', refreshToken);
                if (myAppVersionLocal) Storage.set('myAppVersion', myAppVersionLocal);
                $ionicPopup.alert({title: '缓存', template: '<h4><b>清理成功</b></h4>'});
            },
            chgServer: function () {
                CONFIG.baseUrl = 'http://' + $scope.data.server + '/';
                CONFIG.ioDefaultNamespace = $scope.data.server + '/default';
                Data.abort();
                Socket.default.disconnect(); 
                Socket.new();
                console.log(CONFIG.baseUrl);
            },
            logout: function () {
                User.logout($scope);
            }
        };
    }])
    .controller('feedback', ['$scope', '$ionicHistory', function ($scope, $ionicHistory) {
    }])
    .controller('header', ['$scope', function ($scope) {
    }])
    .controller('footer', ['$scope', function ($scope) {
    }])
;