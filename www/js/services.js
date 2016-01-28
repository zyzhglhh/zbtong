angular.module('yiyangbao.services', ['ngResource'])
.constant('CONFIG', {
  baseUrl: 'http://app.xiaoyangbao.net/',
  ioDefaultNamespace: 'app.xiaoyangbao.net/default',
  consReceiptUploadPath: 'cons/receiptUpload',
  userResUploadPath: 'user/resUpload',
  cameraOptions: { 
    quality: 20,
    destinationType: 1, 
    sourceType: 1, 
    encodingType: 0, 
    correctOrientation: true,
    saveToPhotoAlbum: false,
    cameraDirection: 0 
  },
  uploadOptions: {
    fileExt: '.jpg', 
    httpMethod: 'POST', 
    mimeType: 'image/jpg', 
  },
  showTime: 500,
	/* List all the roles you wish to use in the app
	* You have a max of 31 before the bit shift pushes the accompanying integer out of
	* the memory footprint for an integer
	*/
	userRoles: [
		'public',
    'user',
    'serv',
    'unit',
    'medi',
    'ince',
    'admin',
    'super'
	],
	/* Build out all the access levels you want referencing the roles listed above
	* You can use the "*" symbol to represent access to all roles.
	* The left-hand side specifies the name of the access level, and the right-hand side
	* specifies what user roles have access to that access level. E.g. users with user role
	* 'user' and 'admin' have access to the access level 'user'.
	*/
	accessLevels: {
		'public': "*",
    'anon': ['public'],
    'user': ['user', 'admin', 'super'],
    'serv': ['serv', 'super'],
    'unit': ['unit', 'super'],
    'medi': ['medi', 'super'],
    'ince': ['ince', 'super'],
    'admin': ['admin', 'super']
	},
  genders: [1, 2],
  q1: ['父亲名字',
    '母亲名字',
    '配偶名字',
    '小孩名字',
    '父亲生日',
    '母亲生日',
    '配偶生日',
    '小孩生日'],
  q2: ['最喜欢的颜色',
    '小学名称',
    '初中名称',
    '高中名称',
    '大学的专业',
    '最喜欢的演员'],
  q3: ['最喜欢的歌曲',
    '第一只宠物的名字',
    '最喜欢的水果',
    '最喜欢的食物',
    '最喜欢的宠物'],
  serv400: {number: '4008006666', caption: '4008-006-666'}
})
.factory('Storage', ['$window', function ($window) {
	return {
    set: function(key, value) {
    	$window.localStorage.setItem(key, value);
    },
    get: function(key) {
    	return $window.localStorage.getItem(key);
    },
    rm: function(key) {
    	$window.localStorage.removeItem(key);
    },
    clear: function() {
    	$window.localStorage.clear();
    }
	};
}])
.factory('Token', ['Storage', 'jwtHelper', 'ACL', function (Storage, jwtHelper, ACL) {
  return {
    curUserRole: function () {
      var userRole = ACL.userRoles.public.title;
      try {
        userRole = jwtHelper.decodeToken(Storage.get('token')).userRole;
      }
      catch (e) {
        return ACL.userRoles.public.title;
      }
      return userRole;
    },
    isExpired: function () {
      var isExpired = true;
      try {
        isExpired = jwtHelper.isTokenExpired(Storage.get('token'));
      }
      catch (e) {
        return true;
      }
      return isExpired;
    }
  };
}])
.factory('Data', ['$resource', '$q', 'CONFIG', '$interval', function ($resource, $q, CONFIG, $interval) {
  var self = this;
  var abort = $q.defer();
  var User = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
  		path:'user',
    }, {
      verifyPwd: {method:'POST', params:{route: 'verifyPwd'}, timeout: 10000},
      verifyUser: {method:'POST', params:{route: 'verifyUser'}, timeout: 10000},
    	login: {method:'POST', params:{route: 'login'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
    	getInfo: {method:'GET', params:{route: 'getInfo'}, timeout: 10000},
      getAccInfo: {method:'GET', params:{route: 'getAccInfo'}, timeout: 10000},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000},
      bindBarcode: {method:'POST', params:{route: 'bindBarcode'}, timeout: 10000},
      updateOnesPwd: {method:'POST', params:{route: 'updateOnesPwd'}, timeout: 10000},
      updateOneWithSMS: {method:'POST', params:{route: 'updateOneWithSMS'}, timeout: 10000},
      logout: {method:'GET', params:{route: 'logout'}, timeout: 10000}
    });
  };
  var Insurance = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'ince',
    }, {
      getInfo: {method:'POST', params:{route: 'getInfo'}, timeout: 10000},
      getYljInfo: {method:'POST', params:{route: 'getYljInfo'}, timeout: 10000},
      getBcyljInfo: {method:'POST', params:{route: 'getBcyljInfo'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      remove: {method:'POST', params:{route: 'remove'}, timeout: 10000},
      removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000}
    });
  };
  var Consumption = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'cons',
    }, {
      insertOne: {method:'POST', params:{route: 'insertOne'}, timeout: 10000},
      applyOne: {method:'POST', params:{route: 'applyOne'}, timeout: 10000},
      getOne: {method:'POST', params:{route: 'getOne'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000},
      revoking: {method:'POST', params:{route: 'revoking'}, timeout: 10000}//,
    });
  };
  var Post = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'post',
    }, {
      post: {method:'POST', params:{route:'post'}, timeout: 10000},
      getList: {method:'POST', params:{route: 'getList'}, timeout: abort.promise},
      modify: {method:'POST', params:{route: 'modify'}, timeout: 10000},
      updateOne: {method:'POST', params:{route: 'updateOne'}, timeout: 10000},
      removeOne: {method:'GET', params:{route: 'removeOne'}, timeout: 10000}
    });
  };
  var Resource = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'multer',
    }, {
      rmBrokenFile: {method:'GET', params:{route:'upload'}, timeout: 10000}
    });
  };
  var Interface = function () {
    return $resource(CONFIG.baseUrl + ':path/:route', {
      path:'interface',
    }, {
      smsSend: {method:'POST', params:{route:'smsSend'}, timeout: 10000},
      captchaImg: {method:'GET', params:{route:'captchaImg'}, timeout: 10000}
    });
  };
  self.abort = function ($scope) {
    abort.resolve(); 
    $interval(function () { 
      abort = $q.defer();
      self.User = User(); 
      self.Insurance = Insurance();
      self.Consumption = Consumption();
      self.Post = Post();
      self.Resource = Resource();
      self.Interface = Interface();
    }, 0, 1);
  };
  self.User = User();
  self.Insurance = Insurance();
  self.Consumption = Consumption();
  self.Post = Post();
  self.Resource = Resource();
  self.Interface = Interface();
  return self;
}])
.factory('Socket', ['socketFactory', 'CONFIG', function (socketFactory, CONFIG) {
  var self = this;
  var ioSocket = io.connect(CONFIG.baseUrl + CONFIG.ioDefaultNamespace);
  self.default = socketFactory({
    ioSocket: ioSocket
  });
  self.new = function () {
    ioSocket = io.connect(CONFIG.baseUrl + CONFIG.ioDefaultNamespace);
    console.log(CONFIG.baseUrl + CONFIG.ioDefaultNamespace);
    self.default = socketFactory({
      ioSocket: ioSocket
    });
  };
  self.getSocket = function () { 
    return ioSocket;
  };
  return self;
}])
.factory('User', ['$rootScope', 'PageFunc', '$ionicLoading', '$ionicActionSheet', '$cordovaCamera', '$cordovaFileTransfer', 'CONFIG', '$timeout', 'Storage', 'Data', 'Token', '$state', '$ionicHistory', '$ionicModal', '$q', '$ionicSlideBoxDelegate', 'jwtHelper', '$http', '$interval', function ($rootScope, PageFunc, $ionicLoading, $ionicActionSheet, $cordovaCamera, $cordovaFileTransfer, CONFIG, $timeout, Storage, Data, Token, $state, $ionicHistory, $ionicModal, $q, $ionicSlideBoxDelegate, jwtHelper, $http, $interval) {
  var self = this;
  self.verifyPwd = function (pwd) {
    var deferred = $q.defer();
    Data.User.verifyPwd({password: pwd}, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.verifyUser = function (user, pwdQst) {
    var deferred = $q.defer();
    Data.User.verifyUser({user: user, pwdQst: pwdQst}, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.login = function ($scope) {
    $ionicLoading.show({
      template: '<ion-spinner style="height:2em;width:2em"></ion-spinner>'
    });
    Data.User.login($scope.login, function (data, headers) {
      $scope.error.loginError = '';
      $ionicLoading.hide();
      var userRole = jwtHelper.decodeToken(data.results.token).userRole;
      Storage.set('token', data.results.token);
      if ($scope.login.rememberme) {
        Storage.set('refreshToken', data.results.refreshToken);
      }
      else {
        Storage.rm('refreshToken');
      }
      if (data.results.justActivated) {
        self.bindMobileModal(userRole, '-initBind'); 
      }
      if ($scope.loginModal) {
        $scope.loginModal.remove()
        .then(function () {
          $scope.loginModal = null;
        });
      }
      if ($scope.registerModal) {
        $scope.registerModal.remove()
        .then(function () {
          $scope.registerModal = null;
        });
      }
      if ($scope.pwdResetModal) {
        $scope.pwdResetModal.remove()
        .then(function () {
          $scope.pwdResetModal = null;
        });
      }
      var toStateName = (userRole === 'medi' && 'medi.home') || (userRole === 'serv' && 'serv.home') || (userRole === 'user' && 'user.home') || 'public.aboutUs';
      $state.go($scope.state.toStateName || toStateName);
    }, function (err) {
      var myAppVersionLocal = Storage.get('myAppVersion') || '';
      Storage.clear();
      if (myAppVersionLocal) Storage.set('myAppVersion', myAppVersionLocal);
      $ionicLoading.hide();
      $scope.error.loginError = err.data || '连接超时!';
    });
  };
  self.getInfo = function (token, options, fields) { 
    var deferred = $q.defer();
    Data.User.getInfo({token: token}, function (data, headers) { 
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.getAccInfo = function (token, options, fields) { 
    var deferred = $q.defer();
    Data.User.getAccInfo({token: token}, function (data, headers) { 
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.bindBarcode = function (barcode) {
    var deferred = $q.defer();
    Data.User.bindBarcode(barcode, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.updateOne = function (user, options) {
    var deferred = $q.defer();
    Data.User.updateOne({user: user, options: options}, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.updateOneWithSMS = function (user, options) {
    var deferred = $q.defer();
    Data.User.updateOneWithSMS(user, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.updateOnesPwd = function (user, options) {
    var deferred = $q.defer();
    Data.User.updateOnesPwd(user, function (data, headers) {
      deferred.resolve(data);
    }, function (err) {
      deferred.reject(err);
    });
    return deferred.promise;
  };
  self.logout = function ($scope) {
    var hideSheet = $ionicActionSheet.show({
      buttons: [
        { text: '<b class="assertive">确认退出</b>' }
      ],
      titleText: '确认退出账号吗?',
      cancelText: '取消',
      cancel: function() {
      },
      buttonClicked: function(index) {
        if (index === 0) {
          var refreshToken = Storage.get('refreshToken') && {refreshToken: Storage.get('refreshToken')} || {}; 
          Data.User.logout(refreshToken, function (data, headers) {
          }, function (err) {
          });
          var myAppVersionLocal = Storage.get('myAppVersion') || '';
          Storage.clear();
          if (myAppVersionLocal) Storage.set('myAppVersion', myAppVersionLocal);
          $ionicHistory.clearHistory();
          $ionicHistory.clearCache();
          $state.go('public.aboutUs');
        }
      }
    });
  };
  self.loginModal = function ($scope) {
    $ionicModal.fromTemplateUrl('partials/modal/login.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.loginModal = modal;
      $scope.loginModal.show();
      self.pwdResetModal($scope); 
    });
    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};
    $scope.actions.closeLogin = function () {
      $scope.loginModal.hide();
    };
    $scope.actions.showLogin = function () {
      $scope.loginModal.show();
    };
    $scope.actions.preRegister = function () {
      $scope.actions.closeLogin();
      $scope.actions.showRegister();
    };
    $scope.actions.prePwdReset = function () {
      $scope.actions.closeLogin();
      $scope.actions.showPwdReset();
    };
    $scope.actions.login = function () {
      self.login($scope);
    };
    $scope.login = {
      username: '1',
      password: 'a',
      rememberme: true
    };
  };
  self.registerModal = function ($scope) {
    $ionicModal.fromTemplateUrl('partials/modal/register.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.registerModal = modal;
    });
    $scope.actions.closeRegister = function () {
      $scope.registerModal.hide();
    };
    $scope.actions.showRegister = function () {
      $scope.registerModal.show();
    };
    $scope.actions.preLoginR = function () {
      $scope.actions.closeRegister();
      $scope.actions.showLogin();
    };
    $scope.actions.register = function () {
      self.register($scope.register).then(function (data) {
        $scope.error.registerError = '';
        Storage.set('token', data.results.token);
        if ($scope.loginModal) {
          $scope.loginModal.remove()
          .then(function () {
            $scope.loginModal = null;
          });
        }
        if ($scope.pwdResetModal) {
          $scope.pwdResetModal.remove()
          .then(function () {
            $scope.pwdResetModal = null;
          });
        }
        $scope.registerModal.remove()
        .then(function () {
          $scope.registerModal = null;
        });
        $state.go($scope.state.toStateName || 'user.home');
      }, function (err) {
        var myAppVersionLocal = Storage.get('myAppVersion') || '';
        Storage.clear();
        if (myAppVersionLocal) Storage.set('myAppVersion', myAppVersionLocal);
        $scope.error.registerError = err.data;
      });
    };
    $scope.register = {
      username: 'z',
      mobile: '13282037883',
      password: 'a',
      repeatPassword: 'a',
      name: '周天才',
      gender: true,
      rememberme: false
    };
  };
  self.pwdResetModal = function ($scope) {
    $ionicModal.fromTemplateUrl('partials/modal/pwdReset.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.pwdResetModal = modal;
    });
    $scope.data = {};
    if (!$scope.loginModal && $scope.accountInfo && $scope.accountInfo.user.username) {
      $scope.data.value = $scope.accountInfo.user.username;
    }
    $scope.password = {};
    $scope.config = $scope.config || {};
    $scope.config.serv400 = CONFIG.serv400;
    $scope.currentIndex = 0;
    $scope.error.pwdResetError = '';
    var token;
    $scope.actions.closePwdReset = function () {
      $scope.pwdResetModal.hide();
    };
    $scope.actions.showPwdReset = function () {
      $scope.pwdResetModal.show();
      $timeout(function () { 
        $scope.slidesCount = $ionicSlideBoxDelegate.$getByHandle('pwdReset').slidesCount();
        $ionicSlideBoxDelegate.$getByHandle('pwdReset').enableSlide(false); 
        $ionicSlideBoxDelegate.$getByHandle('pwdReset').update();
      });
    };
    $scope.actions.preLoginP = function () {
      $scope.actions.closePwdReset();
      if ($scope.loginModal) {
        $scope.actions.showLogin();
      }
      else {
        $scope.pwdResetModal.remove()
        .then(function () {
          $scope.pwdResetModal = null;
        });
      }
    };
    $scope.actions.previous = function () {
      $ionicSlideBoxDelegate.$getByHandle('pwdReset').previous();
    };
    $scope.actions.getIndex = function () {
      $scope.currentIndex = $ionicSlideBoxDelegate.$getByHandle('pwdReset').currentIndex();
      $scope.error.pwdResetError = '';
    };
    $scope.actions.verifyUser = function () {
      if (!$scope.data.value) {
        $scope.error.pwdResetError = '请输入正确信息!';
        return;
      }
      self.verifyUser($scope.data.value).then(function (data) {
        $scope.pwdQst = data.results;
        $scope.error.pwdResetError = '';
        $ionicSlideBoxDelegate.$getByHandle('pwdReset').next();
      }, function (err) {
        $scope.error.pwdResetError = err.data;
      });
    };
    $scope.actions.verifyUserSMS = function () {
      var smsType = '-findPwd',
          title = '找回登录密码',
          msg = '请输入手机号',
          mobile;
      if (!$scope.loginModal && $scope.accountInfo && $scope.accountInfo.user.username) {
        smsType = '-findDealPwd';
        title = '找回支付密码';
        mobile = $scope.accountInfo.user.mobile;
      }
      if ($scope.bindMobileModal) {
        $scope.bindMobileModal.show();
      }
      else {
        self.bindMobileModal(Token.curUserRole(), smsType, mobile, title, msg, true);
      }
      $scope.actions.preLoginP();
    };
    $scope.actions.pwdInput = function () {
      if (!$scope.pwdQst[0].a || !$scope.pwdQst[1].a || !$scope.pwdQst[2].a) {
        $scope.error.pwdResetError = '未回答所有密保问题!';
        return;
      }
      self.verifyUser($scope.data.value, $scope.pwdQst).then(function (data) {
        token = data.results;
        $scope.error.pwdResetError = '';
        $ionicSlideBoxDelegate.$getByHandle('pwdReset').next();
      }, function (err) {
        $scope.error.pwdResetError = err.data;
      });
    };
    $scope.actions.pwdReset = function () {
      if (!$scope.password.newPassword || !$scope.password.repeatPwd) {
        $scope.error.pwdResetError = '请输入密码!';
        return;
      }
      if ($scope.password.newPassword !== $scope.password.repeatPwd) {
        $scope.error.pwdResetError = '两次输入不一致!';
        return;
      }
      if (!token) {
        $scope.error.pwdResetError = '认证已过期, 请重新回答问题!';
        return;
      }
      $scope.password.token = token;
      if ($scope.loginModal) {
        $scope.password.targetKey = 'password';
      }
      else {
        $scope.password.targetKey = 'extInfo.yiyangbaoHealInce.dealPassword';
      }
      self.updateOnesPwd($scope.password).then(function () {
        $scope.error.pwdResetError = '';
        $scope.actions.preLoginP();
      }, function (err) {
        $scope.error.pwdResetError = err.data + ', 请重新回答问题!';
      });
    };
  };
  self.passwordModal = function ($scope) {
    $ionicModal.fromTemplateUrl('partials/modal/password.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.passwordModal = modal;
      $scope.passwordModal.show();
    });
    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};
    $scope.password = {
      targetKey: 'password'
    };
    $scope.actions.closePassword = function () {
      $scope.passwordModal.hide();
    };
    $scope.actions.password = function () {
      self.updateOnesPwd($scope.password).then(function () {
        $scope.error.passwordError = '';
        $scope.passwordModal.remove()
        .then(function () {
          $scope.passwordModal = null;
        });
      }, function (err) {
        $scope.error.passwordError = err.data;
      });
    };
  };
  self.dealPasswordModal = function ($scope, oldDealPwd, closeAble) {
    $scope.closeAble = closeAble; 
    $scope.oldDealPwd = oldDealPwd;
    $ionicModal.fromTemplateUrl('partials/modal/dealPassword.html', {
      scope: $scope,
      backdropClickToClose: false, 
      hardwareBackButtonClose: false, 
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.dealPasswordModal = modal;
      $scope.dealPasswordModal.show();
    });
    if ($scope.oldDealPwd) {
      self.pwdResetModal($scope);
    }
    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};
    $scope.payBill = $scope.payBill || {};
    $scope.dealPassword = {
      seriesNum: $scope.payBill.userSocketId,
      targetKey: 'extInfo.yiyangbaoHealInce.dealPassword'
    };
    $scope.password = {
      targetKey: 'password'
    };
    $scope.actions.closeDealPassword = function () {
      $scope.dealPasswordModal.hide();
    };
    $scope.actions.prePwdReset = function () {
      $scope.dealPasswordModal.remove()
      .then(function () {
        $scope.error.dealPasswordError = '';
        $scope.dealPasswordModal = null;
      });
      $scope.actions.showPwdReset();
    };
    $scope.actions.dealPassword = function () {
      self.updateOnesPwd($scope.dealPassword).then(function (data) {
        $scope.error.dealPasswordError = '';
        $scope.dealPassword = {
          targetKey: 'extInfo.yiyangbaoHealInce.dealPassword'
        };
        $scope.dealPwd = true; 
        if ($scope.actions.check) $scope.actions.check(); 
        if (($scope.dealPassword.loginPwd || $scope.password.oldPassword) && $scope.password.newPassword && $scope.password.repeatPwd) {
          $scope.password.loginPwd = $scope.dealPassword.loginPwd;
          $scope.password.seriesNum = $scope.dealPassword.seriesNum;
          self.updateOnesPwd($scope.password).then(function (data) {
            $scope.error.passwordError = '';
            if ($scope.pwdResetModal) {
              $scope.pwdResetModal.remove()
              .then(function () {
                $scope.pwdResetModal = null;
              });
            }
            $scope.dealPasswordModal.remove()
            .then(function () {
              $scope.dealPasswordModal = null;
            });
          }, function () {
            console.log(err);
            $scope.error.passwordError = err.data;
          });
        }
        else {
          if ($scope.pwdResetModal) {
            $scope.pwdResetModal.remove()
            .then(function () {
              $scope.pwdResetModal = null;
            });
          }
          $scope.dealPasswordModal.remove()
          .then(function () {
            $scope.dealPasswordModal = null;
          });
        }
      }, function (err) {
        console.log(err);
        $scope.error.dealPasswordError = err.data;
      });
    };
  };
  self.updateModal = function ($scope) {
    $ionicModal.fromTemplateUrl('partials/modal/update.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.updateModal = modal;
    });
    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};
    $scope.actions.cancel = function () {
      $scope.updateModal.hide();
    };
    $scope.actions.show = function (textarea) {
      $scope.error.updateError = '';
      $scope.textarea = textarea;
      $scope.updateModal.show();
    };
    $scope.actions.submit = function () {
      if (!$scope.data.value) {
        $scope.error.updateError = '输入不能为空!';
        return;
      }
      var upData = {};
      upData[$scope.data.key] = $scope.data.value;
      self.updateOne(upData).then(function (data) {
        $scope.error.updateError = '';
        $scope.data = {};
        if ($scope.accountInfo) {
          $scope.accountInfo.user = data.results;
          $scope.accountInfo.user.personalInfo.birthdate = new Date($scope.accountInfo.user.personalInfo.birthdate);
        }
        if ($scope.info) {
          $scope.info = data.results;
          $scope.info.personalInfo.birthdate = new Date($scope.info.personalInfo.birthdate);
        }
        $scope.actions.cancel();
      }, function (err) {
        if (err.data && err.data.name) {
          $scope.error.updateError = '数据库写入错误!';
          return;
        }
        $scope.error.updateError = err.data;
      });
    };
  };
  self.bindMobileModal = function (userRole, smsType, mobile, title, msg, closeAble) { 
    var $scope = $rootScope.$new(); 
    $ionicModal.fromTemplateUrl('partials/modal/bindMobile.html', {
      scope: $scope, 
      animation: 'slide-in-up',
      backdropClickToClose: false,
      hardwareBackButtonClose: false
    }).then(function (modal) {
      $scope.bindMobileModal = modal;
      $scope.bindMobileModal.show();
    });
    $scope.actions = {};
    $scope.error = {};
    $scope.data = {
      mobile: mobile,
      smsType: smsType
    };
    $scope.config = $scope.config || {};
    $scope.config.title = title || '绑定手机';
    $scope.config.msg = msg || '请输入手机号';
    $scope.config.notCloseAble = closeAble !== true;
    $scope.config.timer = 0;
    $scope.actions.cancel = function () {
      $scope.bindMobileModal.hide();
    };
    $scope.actions.send = function () {
      if (!$scope.data.mobile) {
        $scope.error.bindMobileError = '手机号不能为空!';
        return;
      }
      Data.Interface.smsSend($scope.data, function (data, headers) {
        $scope.error.bindMobileError = '短信已发送, 请查收!';
        $scope.config.timer = data.results.timer;
        $interval(function () {
          $scope.config.timer--;
        }, 1000, data.results.timer);
      }, function (err) {
        $scope.error.bindMobileError = err.data;
      });
    };
    $scope.actions.submit = function () {
      $http.defaults.headers.common['smsAuth'] = $scope.data.verify;
      $http.defaults.headers.common['smsType'] = smsType;
      $http.defaults.headers.common['smsMobile'] = $scope.data.mobile;
      var resAct = 'updateOne';
      if (smsType === '-initBind' && (!$scope.data.mobile || !$scope.data.verify)) {
        $scope.error.bindMobileError = '输入不能为空!';
        return;
      }
      if (smsType === '-chgBind' && (!$scope.data.mobile || !$scope.data.verify || !$scope.data.newMobile)) {
        $scope.error.bindMobileError = '输入不能为空!';
        return;
      }
      if (smsType === '-findPwd' || smsType === '-findDealPwd') {
        if (!$scope.data.mobile || !$scope.data.verify || !$scope.data.newPassword || !$scope.data.repeatPwd) {
          $scope.error.bindMobileError = '输入不能为空!';
          return;
        }
        if ($scope.data.newPassword !== $scope.data.repeatPwd) {
          $scope.error.bindMobileError = '密码不一致!';
          return;
        }
        resAct = 'updateOneWithSMS';
      }
      self[resAct]($scope.data).then(function (data) {
        $scope.error.bindMobileError = '';
        $scope.data = {};
        $scope.bindMobileModal.remove()
        .then(function () {
          $scope.bindMobileModal = null;
          if (userRole === 'user' && closeAble !== true) {
            self.dealPasswordModal($scope);
          }
          else if (closeAble !== true) {
            self.passwordModal($scope);
          }
        });
      }, function (err) {
        if (err.data && err.data.name) {
          $scope.error.bindMobileError = '数据库写入错误!';
          return;
        }
        $scope.error.bindMobileError = err.data;
      });
      delete $http.defaults.headers.common['smsAuth'];
      delete $http.defaults.headers.common['smsType'];
      delete $http.defaults.headers.common['smsMobile'];
    };
  };
  self.pwdQstModal = function ($scope) {
    $ionicModal.fromTemplateUrl('partials/modal/pwdQst.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.pwdQstModal = modal;
      $scope.pwdQstModal.show();
    });
    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};
    $scope.pwdQst = [];
    $scope.actions.closePwdQst = function () {
      $scope.pwdQstModal.hide();
    };
    $scope.actions.pwdQst = function () {
      if (!$scope.pwdQst[0] || !$scope.pwdQst[1] || !$scope.pwdQst[2] || !$scope.pwdQst[0].a || !$scope.pwdQst[1].a || !$scope.pwdQst[2].a) {
        $scope.error.pwdQstError = '输入不能为空!';
        return;
      }
      self.updateOne({'accountInfo.pwdQuestions': $scope.pwdQst}).then(function (data) {
        $scope.error.pwdQstError = '';
        $scope.pwdQstModal.remove()
        .then(function () {
          $scope.pwdQstModal = null;
          $scope.pwdQst = [];
        });
      }, function (err) {
        $scope.error.pwdQstError = err.data;
      });
    };
  };
  self.takePicsModal = function ($scope, images) {
    $ionicModal.fromTemplateUrl('partials/modal/takePics.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.takePicsModal = modal;
      $scope.takePicsModal.show();
      $timeout(function () { 
        $scope.slidesCount = $ionicSlideBoxDelegate.$getByHandle('takePics').slidesCount();
        $ionicSlideBoxDelegate.$getByHandle('takePics').enableSlide(false); 
        $ionicSlideBoxDelegate.$getByHandle('takePics').update();
      }); 
    });
    $scope.actions = $scope.actions || {};
    $scope.error = $scope.error || {};
    $scope.config = $scope.config || {};
    $scope.pageHandler = $scope.pageHandler || {progress: 0};
    for (var i = 0; i < images.length; i++) { 
      for (var j = 0; j < $scope.config.images.length; j++) { 
        if ($scope.config.images[j].title === images[i].title) {
          $scope.config.images[j].Url = images[i].Url;
          $scope.config.images[j]._id = images[i]._id;
        }
      }
    }
    var cameraOptions = angular.copy(CONFIG.cameraOptions), 
        uploadOptions = angular.copy(CONFIG.uploadOptions);
    $scope.currentIndex = 0;
    $scope.actions.closeTakePics = function () {
      $scope.takePicsModal.hide();
    };
    $scope.actions.rmTakePics = function () {
      $scope.takePicsModal.remove()
      .then(function () {
        $scope.takePicsModal = null;
      });
    };
    $scope.actions.previous = function () {
      $ionicSlideBoxDelegate.$getByHandle('takePics').previous();
    };
    $scope.actions.next = function () {
      $ionicSlideBoxDelegate.$getByHandle('takePics').next();
    };
    $scope.actions.getIndex = function () {
      $scope.currentIndex = $ionicSlideBoxDelegate.$getByHandle('takePics').currentIndex();
      $scope.error.takePicsError = '';
    };
    $scope.actions.takePics = function (imgTitle, _id) {
      if (!(window.navigator && window.navigator.camera)) {
        return console.log('不支持window.navigator.camera');
      }
      $cordovaCamera.getPicture(cameraOptions).then(function (imageURI) {
        $timeout(function () {
          var serverUrl = encodeURI(CONFIG.baseUrl + CONFIG.userResUploadPath);
          uploadOptions.headers = {Authorization: 'Bearer ' + Storage.get('token')};
          uploadOptions.fileName = 'imgTitle' + CONFIG.uploadOptions.fileExt;
          uploadOptions.params = {method: '$set', dest: 'personalInfo.idImg', queryTitle: imgTitle, _id: _id, replace: true, inArray: true}; 
          PageFunc.confirm('是否上传?', '上传' + imgTitle).then(function (res) {
            if (res) {
              if (!window.FileTransfer) {
                return console.log('不支持window.FileTransfer');
              }
              return $cordovaFileTransfer.upload(serverUrl, imageURI, uploadOptions, true).then(function (result) {
                  $scope.pageHandler.progress = 0;
                  $scope.error.takePicsError = '';
                  var resImg = JSON.parse(result.response).results;
                  if ($scope.accountInfo) {
                    $scope.accountInfo.user.personalInfo.idImg = resImg;
                    Storage.set('AccInfo', JSON.stringify($scope.accountInfo));
                  }
                  if ($scope.info) {
                    $scope.info.personalInfo.idImg = resImg;
                    Storage.set('info', JSON.stringify($scope.info));
                  }
                  for (var i = 0; i < resImg.length; i++) { 
                    for (var j = 0; j < $scope.config.images.length; j++) {
                      if ($scope.config.images[j].title === resImg[i].title) {
                        $scope.config.images[j].Url = resImg[i].Url;
                        $scope.config.images[j]._id = resImg[i]._id;
                      }
                    }
                  }
                  try {
                    $cordovaCamera.cleanup().then(function () { 
                      console.log("Camera cleanup success.");
                    }, function (err) {
                      console.log(err);
                    });
                  }
                  catch (e) {
                    console.log(e);
                  }
              }, function (err) {
                $scope.error.takePicsError = err;
                $scope.pageHandler.progress = 0;
                try {
                  $cordovaCamera.cleanup().then(function () { 
                    console.log("Camera cleanup success.");
                  }, function (err) {
                    console.log(err);
                  });
                }
                catch (e) {
                  console.log(e);
                }
              }, function (progress) {
                $scope.pageHandler.progress = progress.loaded / progress.total * 100;
              });
            }
            $scope.pageHandler.progress = 0;
            $scope.error.takePicsError = '取消上传!';
            try {
              $cordovaCamera.cleanup().then(function () { 
                console.log("Camera cleanup success.");
              }, function (err) {
                console.log(err);
              });
            }
            catch (e) {
              console.log(e);
            }
          });
        }, 0);
      }, function (err) {
        $scope.error.takePicsError = err;
        console.log(err);
      });
    };
  };
  self.initAccInfo = function ($scope) {
    $scope.error = {};
    var deferred = $q.defer();
    if (Storage.get('AccInfo')) { 
        $scope.accountInfo = JSON.parse(Storage.get('AccInfo'));
        try {
          if ($scope.accountInfo.user.personalInfo.birthdate) $scope.accountInfo.user.personalInfo.birthdate = new Date($scope.accountInfo.user.personalInfo.birthdate);
        }
        catch (e) {}
    }
    self.getAccInfo().then(function (data) {
        $scope.accountInfo = data.results;
        try {
          if ($scope.accountInfo.user.personalInfo.birthdate) $scope.accountInfo.user.personalInfo.birthdate = new Date($scope.accountInfo.user.personalInfo.birthdate);
        }
        catch (e) {}
        Storage.set('AccInfo', JSON.stringify(data.results));
        deferred.resolve(data.results);
    }, function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
  };
  self.initInfo = function ($scope) {
    $scope.error = {};
    var deferred = $q.defer();
    if (Storage.get('info')) { 
        $scope.info = JSON.parse(Storage.get('info'));
        $scope.info.idImgThumb = $scope.info.personalInfo.idImg.filter(function (img) {
            if (img) {
                img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
            }
            return true;
        });
          if ($scope.info.personalInfo.birthdate) $scope.info.personalInfo.birthdate = new Date($scope.info.personalInfo.birthdate);
    }
    self.getInfo().then(function (data) {
        $scope.info = data.results; 
        $scope.info.idImgThumb = $scope.info.personalInfo.idImg.filter(function (img) {
            if (img) {
                img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
            }
            return true;
        });
        try {
          if ($scope.info.personalInfo.birthdate) $scope.info.personalInfo.birthdate = new Date($scope.info.personalInfo.birthdate); 
        }
        catch (e) {
        }
        finally {
        }
        Storage.set('info', JSON.stringify(data.results)); 
        deferred.resolve(data.results);
    }, function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
  };
  return self;
}])
.factory('Insurance', ['Storage', 'Data', 'Token', '$state', '$q', 'jwtHelper', function (Storage, Data, Token, $state, $q, jwtHelper) {
  return {
    getInfo: function (query, options, fields) { 
      var deferred = $q.defer();
      Data.Insurance.getInfo({query: query, options: options, fields: fields}, function (data, headers) { 
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getYljInfo: function (query, options, fields) { 
      var deferred = $q.defer();
      Data.Insurance.getYljInfo({query: query, options: options, fields: fields}, function (data, headers) { 
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getBcyljInfo: function (query, options, fields) { 
      var deferred = $q.defer();
      Data.Insurance.getBcyljInfo({query: query, options: options, fields: fields}, function (data, headers) { 
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getList: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Insurance.getList(query, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    modify: function (ince, options) {
      var deferred = $q.defer();
      Data.Insurance.modify(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    remove: function (ince) {
      var deferred = $q.defer();
      Data.Insurance.remove(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    removeOne: function (ince, options) {
      var deferred = $q.defer();
      Data.Insurance.removeOne(ince, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
}])
.factory('Consumption', ['Storage', 'Data', 'Token', '$state', '$q', 'jwtHelper', function (Storage, Data, Token, $state, $q, jwtHelper) {
  return {
    insertOne: function (cons, options) {
      var deferred = $q.defer();
      Data.Consumption.insertOne(cons, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    applyOne: function (cons, options) {
      var deferred = $q.defer();
      Data.Consumption.applyOne(cons, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getOne: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Consumption.getOne({query: query, options: options, fields: fields}, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    getList: function (query, options, fields) {
      var deferred = $q.defer();
      Data.Consumption.getList({query: query, options: options, fields: fields}, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    updateOne: function (cons, options) {
      var deferred = $q.defer();
      Data.Consumption.updateOne(cons, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    },
    revoking: function (cons, options) {
      var deferred = $q.defer();
      Data.Consumption.revoking(cons, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
}])
.factory('Post', ['Storage', 'Data', 'Token', '$state', '$q', 'jwtHelper', function (Storage, Data, Token, $state, $q, jwtHelper) {
  return {
    post: function (post, options) {
      var deferred = $q.defer();
      Data.Post.post(post, function (data, headers) {
        deferred.resolve(data);
      }, function (err) {
        deferred.reject(err);
      });
      return deferred.promise;
    }
  };
}])
.factory('PageFunc', ['$ionicPopup', '$ionicScrollDelegate', '$ionicSlideBoxDelegate', '$ionicModal', '$timeout', function ($ionicPopup, $ionicScrollDelegate, $ionicSlideBoxDelegate, $ionicModal, $timeout) {
  return {
    message: function (_msg, _time, _title) {
      var messagePopup = $ionicPopup.alert({
        title: _title || '消息', 
        template: _msg, 
        okText: '确认', 
        okType: 'button-energized' 
      });
      if (_time) {
        $timeout(function () {
          messagePopup.close('Timeout!');
        }, _time);
      }
      return messagePopup;
    },
    confirm: function (_msg, _title) {
      var confirmPopup = $ionicPopup.confirm({
        title: _title,
        template: _msg,
        cancelText: '取消',
        cancelType: 'button-default',
        okText: '确定',
        okType: 'button-energized'
      });
      return confirmPopup;  
    },
    prompt: function (_msg, _title) {
      var promptPopup = $ionicPopup.prompt({
        title: _title,
        template: _msg,
        inputType: 'password', 
        inputPlaceholder: _msg, 
        cancelText: '取消',
        cancelType: 'button-default',
        okText: '确定',
        okType: 'button-energized'
      });
      return promptPopup;  
    },
    selection: function (_msg, _title, _res, $scope) {
      var selectionPopup = $ionicPopup.show({
        title: _title,
        template: _msg,
        scope: $scope,
        buttons: [{
          text: '取消',
          type: 'button-default',
          onTap: function(e) {
          }
        }, {
          text: '确定',
          type: 'button-positive',
          onTap: function(e) {
            return $scope[_res].selected; 
          }
        }]
      });
      return selectionPopup;  
    },
    viewer: function ($scope, images, $index) {
      $ionicModal.fromTemplateUrl('partials/modal/viewer.html', {
        scope: $scope,
        animation: 'slide-in-up'
      }).then(function (modal) {
        $scope.viewerModal = modal;
        $scope.viewerModal.show();
        $timeout(function () { 
          $scope.currentIndex = $index;
          $scope.slidesCount = $ionicSlideBoxDelegate.$getByHandle('viewer').slidesCount();
        }); 
      });
      $scope.actions = $scope.actions || {};
      $scope.error = $scope.error || {};
      $scope.images = images;
      $scope.zoomMin = 1;
      $scope.zoomMax = 3;
      var tapTimeStamp;
      var exitTimeout;
      var tapInterval = 300;
      $scope.actions.exit = function ($event) {
        if (tapTimeStamp && $event.timeStamp - tapTimeStamp < tapInterval) {
          $timeout.cancel(exitTimeout);
        }
        else {
          tapTimeStamp = $event.timeStamp;
          exitTimeout = $timeout(function () {
            $scope.viewerModal.remove()
            .then(function () {
            });
          }, tapInterval);
        }
      };
      $scope.actions.zoom = function ($index) {
        var zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + $index).getScrollPosition().zoom;
        if (zoomFactor === $scope.zoomMax) {
          $ionicScrollDelegate.$getByHandle('scrollHandle' + $index).zoomTo(1, true); 
        }
        else {
          $ionicScrollDelegate.$getByHandle('scrollHandle' + $index).zoomBy(2, true); 
        }
      };
      $scope.actions.updateSlideStatus = function($index) {
        var zoomFactor = $ionicScrollDelegate.$getByHandle('scrollHandle' + $index).getScrollPosition().zoom;
        if (zoomFactor === $scope.zoomMin) {
          $ionicSlideBoxDelegate.enableSlide(true);
        } else {
          $ionicSlideBoxDelegate.enableSlide(false);
        }
      };
      $scope.actions.getIndex = function () {
        $scope.currentIndex = $ionicSlideBoxDelegate.$getByHandle('viewer').currentIndex();
      };
    }
  };
}])
.factory('barcodeXs', ['$ionicPopup', '$ionicScrollDelegate', '$ionicSlideBoxDelegate', '$ionicModal', '$timeout', 'Insurance', 'User', 'PageFunc', function ($ionicPopup, $ionicScrollDelegate, $ionicSlideBoxDelegate, $ionicModal, $timeout, Insurance, User, PageFunc) {
  var self = this;
  self.routes = function (barcode, role, func) {
    self[role][func](barcode);
  };
  self.user = {
    bindBarcode: function (barcode) {
      User.bindBarcode({query: 'whatever', barcode: barcode}).then(function (data) {
        var results = data.results;
        if (results === 'OK') {
          return PageFunc.message('卡号绑定成功!', 1000);
        }
        if (results.length > 0) {
          $scope.selection = { 
            inces: results
          };
          $scope.ince = { 
            selected: results[0]
          };
          PageFunc.selection('<select ng-options="_ince.unit for _ince in selection.inces" ng-model="ince.selected"></select>', '请选择需要绑定的保单', 'ince', $scope).then(function (res) { 
            if (res) {
              Insurance.modify({inceObj: {_id: res._id, seriesNum: barcode}}).then(function (data) {
                PageFunc.message('卡号绑定成功!', 1000);
              }, function (err) {
                PageFunc.message(err.data, 1000);
              });
            }
          });
        }
      }, function (err) {
        PageFunc.message(err.data, 1000);
      });
    },
    general: function (barcode) {
    }
  };
  return self;
}])
.factory('Auth', ['Storage', 'Data', '$q', 'ACL', 'Token', function (Storage, Data, $q, ACL, Token) {
  return {
    authorize: function(accessLevel, role) {
        if (role === undefined) {
            role = ACL.userRoles[Token.curUserRole()];
        }
        return accessLevel.bitMask & role.bitMask;
    },
    isLoggedIn: function() {
        return !Token.isExpired();
    }
  };
}])
;