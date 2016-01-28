angular.module('yiyangbao.controllers.backend', [])
    .controller('mediTabsBottom', ['$scope', '$timeout', '$state', '$cordovaBarcodeScanner', function ($scope, $timeout, $state, $cordovaBarcodeScanner) {
        $scope.newConsNum = 1;
        $scope.actions = {
            clearConsBadge: function () {
                $timeout(function () {
                    $scope.newConsNum = 0;
                }, 500);
            }
        };
    }])
    .controller('mediBarcode', ['$scope', '$state', '$cordovaBarcodeScanner', '$ionicHistory', 'PageFunc', 'Insurance', 'Consumption', 'User', 'Socket', 'Storage', function ($scope, $state, $cordovaBarcodeScanner, $ionicHistory, PageFunc, Insurance, Consumption, User, Socket, Storage) {
        $scope.error = {};
        var payingPopup;
        var inceInfo;
        $scope.actions = {
            scan: function (event) {
                $scope.error.checkError = '';
                if (!(window.cordova && window.cordova.plugins && window.cordova.plugins.barcodeScanner)) {
                    return $scope.error.checkError = '不支持cordova.plugins.barcodeScanner';
                }
                $cordovaBarcodeScanner.scan().then(function (result) { 
                    if (result.cancelled) {
                        $ionicHistory.goBack(0); 
                        return $scope.error.checkError = '用户取消';
                    }
                    var barcode = result.text;
                        $scope.payBill = {
                            mediId: JSON.parse(Storage.get('info'))._id,
                            userSocketId: barcode.split(')|(')[0],
                            available: barcode.split(')|(')[1]
                        };
                        inceInfo = null;
                        if ($scope.payBill.available === undefined) {
                            barcode = $scope.payBill.userSocketId;
                            Insurance.getInfo({seriesNum: barcode}).then(function (data) {
                                inceInfo = data.results;
                                $scope.payBill.available = data.results.ince.available;
                                $scope.dealPwd = data.results.user.dealPwd;
                            }, function (err) {
                                $scope.error.checkError = err.data;
                            });
                        }
                }, function (err) {
                    console.log(err);
                    $scope.error.checkError = err;
                });
            },
            check: function () {
                if (inceInfo) {
                    if ($scope.dealPwd === true) {
                        PageFunc.prompt('支付密码', '请输入支付密码').then(function (res) {
                            if (res) {
                                var ince = inceInfo.ince;
                                var cons = {
                                    userId: inceInfo.user._id,
                                    money: $scope.payBill.money,
                                    consType: 'medi',
                                    note: $scope.payBill.note,
                                    seriesNum: ince.seriesNum,
                                    mediId: $scope.payBill.mediId,
                                    incePolicyId: ince._id,
                                    unitId: ince.unitId,
                                    inceId: ince.inceId,
                                    servId: ince.servId,
                                    password: res
                                };
                                Consumption.insertOne(cons).then(function (data) {
                                    $scope.error.checkError = '用户支付' + data.results.cons.money + '元'; 
                                    $scope.payBill.money = null;
                                    $scope.payBill.available = undefined;
                                }, function (err) {
                                    $scope.error.checkError = err.data; 
                                });
                            }
                            else {
                                $scope.error.checkError = '未输入密码!';
                            }
                        });
                    }
                    else {
                        User.dealPasswordModal($scope, null, true); 
                    }
                }
                else {
                    Socket.default.emit('pay bill', $scope.payBill, 'check');
                    payingPopup = PageFunc.message('用户支付中...');
                }
            }
        };
        Socket.default.on('pay bill', function (data, actions, options, cb) { 
            if (actions === 'paid' || actions === 'payError' || actions === 'cancelPay') {
                payingPopup.close(data); 
                $scope.error.checkError = data.msg || '用户取消支付'; 
                if (actions === 'paid') {
                    $scope.payBill.money = null;
                    $scope.payBill.available = undefined;
                }
            }
        });
        var unbindModalHidden = $scope.$on('modal.hidden', function () { 
            $scope.error.checkError = "取消输入";
        });
        $scope.$on('$destroy', function () {
            Socket.getSocket().removeAllListeners(); 
            unbindModalHidden();
            unbindModalHidden = null;
        });
    }])
    .controller('mediConsList', ['$scope', '$q', '$ionicPopover', 'Consumption', function ($scope, $q, $ionicPopover, Consumption) {
        var batch = null;
        var lastTime = null; 
        var consList = [];
        var init = function () {
            var deferred = $q.defer();
            Consumption.getList(null, {skip: 0, limit: batch}).then(function (data) {
                consList = data.results;
                $scope.items = consList.filter(function (item) {
                    if ((!item.status.isSubmitted && !item.status.isAudited && !item.status.isRevoked && !item.status.isDone) || (item.status.isSubmitted && !item.status.isAudited && !item.status.isRevoked && !item.status.isDone && $scope.filters.checkBoxItems[0].checked === true) || (item.status.isAudited && !item.status.isDone && $scope.filters.checkBoxItems[1].checked === true) || (item.status.isRevoked && $scope.filters.checkBoxItems[2].checked === true) || (item.status.isDone && $scope.filters.checkBoxItems[3].checked === true)) {
                        if (item.receiptImg && item.receiptImg[0]) {
                            item.receiptImgUrl = item.receiptImg[0].Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/sm_$1'); 
                        }
                        return true;
                    }
                });
                lastTime = Date.now(); 
                deferred.resolve();
            }, function (err) {
                console.log(err.data);
                deferred.reject();
            });
            return deferred.promise;
        };
        $scope.$on('$ionicView.beforeEnter', function () { 
            var thisMoment = Date.now();
            if ((thisMoment - lastTime)/3600000 > 1) {
                init();
            }
        });
        $scope.filters = {
            title: '消费记录筛选',
            isCheckBox: true,
            checkBoxItems: [
                { text: "已提交", checked: false },
                { text: "已审核", checked: false },
                { text: "已核销", checked: false },
                { text: "已完成", checked: false }
            ],
            height: '280px'
        };
        $ionicPopover.fromTemplateUrl('partials/popover/filter.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.filterPopover = popover;
        });
        $scope.$on('$destroy', function () {
            $scope.filterPopover.remove();
        });
        $scope.actions = {
            doRefresh: function () {
                init()
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            showFilter: function ($event) {
                $scope.filterPopover.show($event);
            },
            closeFilter: function () {
                $scope.filterPopover.hide();
            },
            filterItems: function () {
                $scope.items = consList.filter(function (item) {
                    if ((!item.status.isSubmitted && !item.status.isAudited && !item.status.isRevoked && !item.status.isDone) || (item.status.isSubmitted && !item.status.isAudited && !item.status.isRevoked && !item.status.isDone && $scope.filters.checkBoxItems[0].checked === true) || (item.status.isAudited && !item.status.isDone && $scope.filters.checkBoxItems[1].checked === true) || (item.status.isRevoked && $scope.filters.checkBoxItems[2].checked === true) || (item.status.isDone && $scope.filters.checkBoxItems[3].checked === true)) {
                        if (item.receiptImg && item.receiptImg[0]) {
                            item.receiptImgUrl = item.receiptImg[0].Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/sm_$1'); 
                        }
                        return true;
                    }
                });
            }
        };
    }])
    .controller('mediConsDetail', ['$q', '$scope', '$state', '$stateParams', '$cordovaCamera', '$cordovaFileTransfer', '$timeout', '$ionicLoading', 'PageFunc', 'User', 'Consumption', 'CONFIG', 'Storage', function ($q, $scope, $state, $stateParams, $cordovaCamera, $cordovaFileTransfer, $timeout, $ionicLoading, PageFunc, User, Consumption, CONFIG, Storage) {
        $scope.error = {};
        var cameraOptions = CONFIG.cameraOptions;
        var uploadOptions = CONFIG.uploadOptions; 
        $scope.pageHandler = {
            progress: 0,
            showDelete: false
        };
        $scope.actions = {
            showDelete: function () {
                $scope.pageHandler.showDelete = !$scope.pageHandler.showDelete;
            },
            deleteImg: function (item, $index) {
                PageFunc.confirm('是否确认删除?', '删除图片').then(function (res) {
                    if (res) {
                        Consumption.updateOne({_id: $stateParams.consId, pull: {Url: item.receiptImg[$index].Url, path: item.receiptImg[$index].path, title: item.receiptImg[$index].title}}).then(function (data) {
                        }, function (err) {
                            $scope.error.receiptError = err.data;
                            console.log(err.data);
                        });
                        item.receiptImg.splice($index, 1);
                        item.receiptImgThumb.splice($index, 1);
                    }
                });
            },
            takePic: function () {
                if (!(window.navigator && window.navigator.camera)) {
                    return console.log('不支持window.navigator.camera');
                }
                $cordovaCamera.getPicture(cameraOptions).then(function (imageURI) {
                    $timeout(function () {
                        var serverUrl = encodeURI(CONFIG.baseUrl + CONFIG.consReceiptUploadPath);
                        uploadOptions.headers = {Authorization: 'Bearer ' + Storage.get('token')};
                        uploadOptions.fileName = $stateParams.consId + CONFIG.uploadOptions.fileExt;
                        uploadOptions.params = {_id: $stateParams.consId};
                        PageFunc.confirm('是否上传?', '上传图片').then(function (res) {
                            if (res) {
                                $ionicLoading.show({
                                    template: '<ion-spinner style="height:2em;width:2em"></ion-spinner>'
                                });
                                if (!window.FileTransfer) {
                                    return console.log('不支持window.FileTransfer');
                                }
                                return $cordovaFileTransfer.upload(serverUrl, imageURI, uploadOptions, true).then(function (result) {
                                    $scope.pageHandler.progress = 0; 
                                    $ionicLoading.hide();
                                    $scope.error.receiptError = '上传成功!'; 
                                    $scope.item.receiptImg = JSON.parse(result.response).results.receiptImg; 
                                    $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                                        if (img) {
                                            img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                                        }
                                        return true;
                                    });
                                    try {
                                        $cordovaCamera.cleanup().then(function () { 
                                        }, function (err) {
                                            console.log(err);
                                        });
                                    }
                                    catch (e) {
                                        console.log(e);
                                    }
                                }, function (err) {
                                    console.log(err);
                                    $scope.error.receiptError = err;
                                    $scope.pageHandler.progress = 0;
                                    $ionicLoading.hide();
                                    try {
                                        $cordovaCamera.cleanup().then(function () { 
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
                            $scope.error.receiptError = '取消上传!';
                            try {
                                $cordovaCamera.cleanup().then(function () { 
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
                    $scope.error.receiptError = err;
                    console.log(err);
                });
            },
            submit: function () {
                PageFunc.confirm('是否提交?', '提交记录').then(function (res) {
                    if (res) {
                        return Consumption.updateOne({_id: $stateParams.consId, set: 'submit'}).then(function (data) {
                            $scope.item = data.results;
                            $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                                if (img) {
                                    img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                                }
                                return true;
                            });
                            $scope.item.idImgThumb = $scope.item.userId.personalInfo.idImg.filter(function (img) {
                                if (img) {
                                    img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                                }
                                return true;
                            });
                            $scope.error.receiptError = '提交成功!';
                        }, function (err) {
                            $scope.error.receiptError = err.data;
                            console.log(err.data);
                        });
                    }
                });
            },
            doRefresh: function () {
                init(true)
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            viewer: function ($index, group) {
                var images = group && $scope.item.userId.personalInfo.idImg || $scope.item.receiptImg;
                PageFunc.viewer($scope, images, $index);
            },
            revoking: function () {
                PageFunc.prompt('请输入登录密码确认', '是否退款?').then(function (res) {
                    if (res) {
                        User.verifyPwd(res).then(function (data) {
                            if (data.results === 'OK') {
                                Consumption.revoking({_id: $scope.item._id}).then(function (data) {
                                    console.log(data.results);
                                    $scope.item = data.results;
                                    $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                                        if (img) {
                                            img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                                        }
                                        return true;
                                    });
                                    $scope.item.idImgThumb = $scope.item.userId.personalInfo.idImg.filter(function (img) {
                                        if (img) {
                                            img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                                        }
                                        return true;
                                    });
                                }, function (err) {
                                    $scope.error.receiptError = err.data;
                                });
                            }
                        }, function (err) {
                            $scope.error.receiptError = err.data;
                        });
                    }
                    else {
                        $scope.error.receiptError = '用户取消!';
                    }
                });
            }
        };
        var init = function (refresh) {
            var deferred = $q.defer();
            if ($stateParams.cons && !refresh) {
                $scope.item = $stateParams.cons;
                $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                    if (img) {
                        img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                    }
                    return true;
                });
                $scope.item.idImgThumb = $scope.item.userId.personalInfo.idImg.filter(function (img) {
                    if (img) {
                        img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                    }
                    return true;
                });
                deferred.resolve();
            }
            else {
                Consumption.getOne({_id: $stateParams.consId}).then(function (data) {
                    $scope.item = data.results;
                    $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                        if (img) {
                            img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                        }
                        return true;
                    });
                    $scope.item.idImgThumb = $scope.item.userId.personalInfo.idImg.filter(function (img) {
                        if (img) {
                            img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                        }
                        return true;
                    });
                    deferred.resolve();
                }, function (err) {
                    deferred.reject();
                    console.log(err.data);
                });
            }
            return deferred.promise;
        };
        init();
    }])
    .controller('mediHome', ['$scope', 'Storage', '$q', 'User', 'PageFunc', function ($scope, Storage, $q, User, PageFunc) {
        User.initInfo($scope);
        $scope.actions = {
            doRefresh: function () {
                User.initInfo($scope)
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            viewer: function ($index) {
                var images = $scope.info.idImgThumb;
                PageFunc.viewer($scope, images, $index);
            }
        };
    }])
    .controller('mediMine', ['$scope', '$ionicPopup', '$q', '$ionicActionSheet', '$cordovaCamera', '$cordovaFileTransfer', 'Storage', 'User', '$timeout', 'PageFunc', 'CONFIG', 'Token', function ($scope, $ionicPopup, $q, $ionicActionSheet, $cordovaCamera, $cordovaFileTransfer, Storage, User, $timeout, PageFunc, CONFIG, Token) {
        $scope.config = {
            q1: CONFIG.q1,
            q2: CONFIG.q2,
            q3: CONFIG.q3,
            images: [{title: '营业执照'}, {title: '机构照片'}]
        };
        $scope.pageHandler = {
            progress: 0
        };
        $scope.data = {};
        var cameraOptions = angular.copy(CONFIG.cameraOptions), 
            uploadOptions = angular.copy(CONFIG.uploadOptions);
        User.initInfo($scope);
        $scope.actions = {
            doRefresh: function () {
                User.initInfo($scope)
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            chgHead: function () {
                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                       { text: '<b>拍摄头像</b>' },
                       { text: '相册照片' }
                    ],
                    titleText: '设置头像',
                    cancelText: '取消',
                    cancel: function () {
                    },
                    buttonClicked: function (index) {
                        cameraOptions.allowEdit = true;
                        cameraOptions.targetWidth = 800;
                        cameraOptions.targetHeight = 800;
                        cameraOptions.cameraDirection = 1;
                        switch (index) {
                            case 0: {
                                cameraOptions.sourceType = 1;
                            }
                            break;
                            case 1: {
                                cameraOptions.sourceType = 2;
                            }
                            break;
                        }
                        if (!(window.navigator && window.navigator.camera)) {
                            return console.log('不支持window.navigator.camera');
                        }
                        $cordovaCamera.getPicture(cameraOptions).then(function (imageURI) {
                            $timeout(function () {
                                var serverUrl = encodeURI(CONFIG.baseUrl + CONFIG.userResUploadPath);
                                uploadOptions.headers = {Authorization: 'Bearer ' + Storage.get('token')};
                                uploadOptions.fileName = 'userHead' + CONFIG.uploadOptions.fileExt;
                                uploadOptions.params = {method: '$set', dest: 'head', replace: true}; 
                                PageFunc.confirm('是否上传?', '上传头像').then(function (res) {
                                    if (res) {
                                        if (!window.FileTransfer) {
                                            return console.log('不支持window.fileTransfer');
                                        }
                                        return $cordovaFileTransfer.upload(serverUrl, imageURI, uploadOptions, true).then(function (result) {
                                            $scope.pageHandler.progress = 0;
                                            $scope.info.head = {Url: JSON.parse(result.response).results.Url};
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
                                            console.log(err);
                                            $scope.error.headError = err;
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
                                    $scope.error.headError = '取消上传!';
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
                            $scope.error.headError = err;
                            console.log(err);
                        });
                        return true;
                    }
                });
            },
            chgUsername: function () {
                if ($scope.info.username !== $scope.info.personalInfo.idNo) {
                    return;
                }
                $scope.config.title = '修改用户名';
                $scope.data.key = 'username';
                $scope.data.value = $scope.info.username;
                $scope.actions.show();
            },
            chgMobile: function () {
                var smsType, title, msg;
                if ($scope.info.mobile) {
                    smsType = '-chgBind';
                    title = '修改手机号';
                    msg = '请输入当前绑定手机号';
                }
                else {
                    smsType = '-initBind';
                    title = '绑定手机号';
                    msg = '请输入手机号';
                }
                if ($scope.bindMobileModal) {
                    $scope.bindMobileModal.show();
                }
                else {
                    User.bindMobileModal(Token.curUserRole(), smsType, $scope.info.mobile, title, msg, true);
                }
            },
            chgEmail: function () {
                $scope.config.title = '修改邮箱地址';
                $scope.data.key = 'email';
                $scope.data.value = $scope.info.email;
                $scope.actions.show();
            },
            chgPwd: function () {
                if ($scope.passwordModal) {
                    $scope.passwordModal.show();
                }
                else {
                    User.passwordModal($scope);
                }
            },
            chgPwdQst: function () {
                PageFunc.prompt('登录密码', '请输入登录密码').then(function (res) {
                    if (res) {
                        User.verifyPwd(res).then(function (data) {
                            if (data.results === 'OK') {
                                $scope.config.title = '设置密保问题';
                                if ($scope.pwdQstModal) {
                                    $scope.pwdQstModal.show();
                                }
                                else {
                                    User.pwdQstModal($scope);
                                }
                            }
                        }, function (err) {
                            console.log(err.data);
                        });
                    }
                    else {
                    }
                });
            },
            chgName: function () {
                $scope.config.title = '修改机构名';
                $scope.data.key = 'personalInfo.name';
                $scope.data.value = $scope.info.personalInfo.name;
                $scope.actions.show();
            },
            chgIdNo: function () {
                PageFunc.message('如有错误, 请联系服务专员修改!<br><a ng-href="tel:' + CONFIG.serv400.number + '">' + CONFIG.serv400.caption + '</a>');
            },
            chgLocation: function () {
                $scope.config.title = '修改地址';
                $scope.data.key = 'personalInfo.location.city.name';
                $scope.data.value = $scope.info.personalInfo.location && $scope.info.personalInfo.location.city && $scope.info.personalInfo.location.city.name;
                $scope.actions.show();
            },
            chgIdImg: function () {
                $scope.config.title = '拍摄机构照片';
                if ($scope.takePicsModal) {
                    $scope.takePicsModal.show();
                }
                else {
                    User.takePicsModal($scope, $scope.info.personalInfo.idImg);
                }
            },
            chgIntro: function () {
                $scope.config.title = '修改机构介绍';
                $scope.data.key = 'personalInfo.intro';
                $scope.data.value = $scope.info.personalInfo.intro;
                $scope.actions.show(true);
            },
        };
        $scope.$on('$ionicView.loaded', function () { 
            User.updateModal($scope);
        });
    }])
    .controller('mediSettings', ['$scope', '$ionicPopup', '$q', 'Storage', 'User', function ($scope, $ionicPopup, $q, Storage, User) {
        User.initInfo($scope);
        $scope.actions = {
            doRefresh: function () {
                User.initInfo($scope)
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
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
            logout: function () {
                User.logout($scope);
            }
        };
    }])
    .controller('mediHelper', ['$scope', function ($scope) {
    }])
    .controller('mediFeedback', ['$scope', function ($scope) {
    }])
    .controller('mediSearch', ['$scope', function ($scope) {
    }])
    .controller('mediReceipt', ['$scope', function ($scope) {
    }])
    .controller('servTabsBottom', ['$scope', '$timeout', '$state', '$cordovaBarcodeScanner', 'Insurance', 'PageFunc', function ($scope, $timeout, $state, $cordovaBarcodeScanner, Insurance, PageFunc) {
        $scope.newConsNum = 1;
        $scope.actions = {
            clearConsBadge: function () {
                $timeout(function () {
                    $scope.newConsNum = 0;
                }, 500);
            }
        };
    }])
    .controller('servBarcode', ['$scope', '$state', '$stateParams', '$cordovaBarcodeScanner', '$ionicHistory', 'PageFunc', 'Insurance', 'Consumption', 'User', 'Socket', 'Storage', function ($scope, $state, $stateParams, $cordovaBarcodeScanner, $ionicHistory, PageFunc, Insurance, Consumption, User, Socket, Storage) {
        $scope.error = {};
        $scope.data = {};
        $scope.actions = {
            scan: function (event) {
                $scope.error.bindError = '';
                if (!(window.cordova && window.cordova.plugins && window.cordova.plugins.barcodeScanner)) {
                    return $scope.error.bindError = '不支持cordova.plugins.barcodeScanner';
                }
                $cordovaBarcodeScanner.scan().then(function (result) {
                    if (result.cancelled) {
                        $ionicHistory.goBack(0); 
                        return $scope.error.bindError = '用户取消';
                    }
                    $scope.data.barcode = result.text;
                    Insurance.getInfo({seriesNum: result.text}).then(function (data) {
                        PageFunc.message('该卡已被用户 <i>' + data.results.user.name + '</i> 绑定, <a href="' + data.results.user.mobile + '">联系' + (data.results.user.gender === 1 && '他' || '她') + '</a>, <br>请换一张卡!', 3000);
                    }, function (err) {
                        if (err.data === '保单不存在!') {
                            return $scope.error.bindError = '卡号有效, 请绑定!';
                        }
                        PageFunc.message(err.data, 3000);
                    });
                }, function (err) {
                    console.log(err);
                    return $scope.error.bindError = err;
                });
            },
            bindBarcode: function () {
                if (!$scope.data.query || !$scope.data.barcode) {
                    $scope.error.bindError = '信息不完整, 请重新扫描或输入!';
                    return;
                }
                User.bindBarcode($scope.data).then(function (data) {
                    if (data.results === 'OK') {
                        $scope.data = {};
                        return $scope.error.bindError = '卡号绑定成功!';
                    }
                    if (data.results.length > 0) {
                        $scope.selection = {
                            inces: data.results
                        };
                        $scope.ince = { 
                            selected: $scope.selection.inces[0]
                        };
                        PageFunc.selection('<select ng-options="_ince.unit for _ince in selection.inces" ng-model="ince.selected"></select>', '请选择需要绑定的保单', 'ince', $scope).then(function (res) { 
                            if (res) {
                                Insurance.modify({inceObj: {_id: res._id, seriesNum: $scope.data.barcode, userId: res.userId}}).then(function (data) {
                                    $scope.data = {};
                                    $scope.error.bindError = '卡号绑定成功!';
                                }, function (err) {
                                    console.log(err);
                                    $scope.error.bindError = err.data;
                                });
                            }
                        });
                    }
                }, function (err) {
                    $scope.error.bindError = err.data;
                });
            }
        };
    }])
    .controller('servConsList', ['$scope', '$q', '$ionicPopover', 'Consumption', 'PageFunc', '$cordovaBarcodeScanner', '$ionicHistory', 'Storage', function ($scope, $q, $ionicPopover, Consumption, PageFunc, $cordovaBarcodeScanner, $ionicHistory, Storage) {
        var batch = null;
        var lastTime = null; 
        var consList = [];
        var init = function () {
            var deferred = $q.defer();
            var authlist = JSON.parse(Storage.get('info')).extInfo.yiyangbaoHealInce.authorizedBy.filter(function (auth) {
                if (auth.isRevoked === false) {
                    delete auth.isRevoked;
                    delete auth.unitName;
                    return true;
                }
            });
            Consumption.getList(authlist, {skip: 0, limit: batch}).then(function (data) {
                consList = data.results;
                $scope.items = consList.filter(function (item) {
                    if ((!item.status.isSubmitted && !item.status.isAudited && !item.status.isRevoked && !item.status.isDone) || (item.status.isSubmitted && !item.status.isAudited && !item.status.isRevoked && !item.status.isDone && $scope.filters.checkBoxItems[0].checked === true) || (item.status.isAudited && !item.status.isDone && $scope.filters.checkBoxItems[1].checked === true) || (item.status.isRevoked && $scope.filters.checkBoxItems[2].checked === true) || (item.status.isDone && $scope.filters.checkBoxItems[3].checked === true)) {
                        if (item.receiptImg && item.receiptImg[0]) {
                            item.receiptImgUrl = item.receiptImg[0].Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/sm_$1'); 
                        }
                        return true;
                    }
                });
                lastTime = Date.now(); 
                deferred.resolve();
            }, function (err) {
                console.log(err.data);
                deferred.reject();
            });
            return deferred.promise;
        };
        $scope.$on('$ionicView.beforeEnter', function () { 
            var thisMoment = Date.now();
            if ((thisMoment - lastTime)/3600000 > 1) {
                init();
            }
        });
        $scope.filters = {
            title: '消费记录筛选',
            isCheckBox: true,
            checkBoxItems: [
                { text: "已提交", checked: true },
                { text: "已审核", checked: false },
                { text: "已核销", checked: false },
                { text: "已完成", checked: false }
            ],
            height: '280px'
        };
        $ionicPopover.fromTemplateUrl('partials/popover/filter.html', {
            scope: $scope
        }).then(function (popover) {
            $scope.filterPopover = popover;
        });
        $scope.$on('$destroy', function () {
            $scope.filterPopover.remove();
        });
        $scope.actions = {
            doRefresh: function () {
                init()
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            showFilter: function ($event) {
                $scope.filterPopover.show($event);
            },
            closeFilter: function () {
                $scope.filterPopover.hide();
            },
            filterItems: function () {
                $scope.items = consList.filter(function (item) {
                    if ((!item.status.isSubmitted && !item.status.isAudited && !item.status.isRevoked && !item.status.isDone) || (item.status.isSubmitted && !item.status.isAudited && !item.status.isRevoked && !item.status.isDone && $scope.filters.checkBoxItems[0].checked === true) || (item.status.isAudited && !item.status.isDone && $scope.filters.checkBoxItems[1].checked === true) || (item.status.isRevoked && $scope.filters.checkBoxItems[2].checked === true) || (item.status.isDone && $scope.filters.checkBoxItems[3].checked === true)) {
                        if (item.receiptImg && item.receiptImg[0]) {
                            item.receiptImgUrl = item.receiptImg[0].Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/sm_$1'); 
                        }
                        return true;
                    }
                });
            },
            scan: function (event) {
                if (!(window.cordova && window.cordova.plugins && window.cordova.plugins.barcodeScanner)) {
                    return PageFunc.message('不支持扫码!', 2000);
                }
                $cordovaBarcodeScanner.scan().then(function (result) {
                    if (result.cancelled) {
                        $ionicHistory.goBack(0); 
                        return console.log('用户取消!');
                    }
                    Consumption.getOne({_id: result.text}).then(function (data) {
                        var cons = data.results;
                        $scope.items = consList.filter(function (item) {
                            if (item._id === cons._id) {
                                if (cons.status.isRevoked === true) {
                                    return PageFunc.message('申请已退回!', 2000);
                                }
                                if (cons.status.isDone === true) {
                                    return PageFunc.message('申请已通过!', 2000);
                                }
                                return true;
                            }
                        });
                        if ($scope.items.length === 0) {
                            PageFunc.message('理赔申请不存在!', 2000);
                        }
                    }, function (err) {
                        PageFunc.message('理赔申请不存在!', 2000);
                    });
                }, function (err) {
                    PageFunc.message('扫码错误!', 2000);
                });
            }
        };
    }])
    .controller('servConsDetail', ['$q', '$scope', '$state', '$stateParams', '$cordovaCamera', '$cordovaFileTransfer', '$timeout', '$ionicLoading', 'PageFunc', 'Consumption', 'CONFIG', 'Storage', function ($q, $scope, $state, $stateParams, $cordovaCamera, $cordovaFileTransfer, $timeout, $ionicLoading, PageFunc, Consumption, CONFIG, Storage) {
        $scope.error = {};
        var cameraOptions = CONFIG.cameraOptions;
        var uploadOptions = CONFIG.uploadOptions; 
        $scope.pageHandler = {
            progress: 0,
            showDelete: false
        };
        $scope.actions = {
            showDelete: function () {
                $scope.pageHandler.showDelete = !$scope.pageHandler.showDelete;
            },
            deleteImg: function (item, $index) {
                PageFunc.confirm('是否确认删除?', '删除图片').then(function (res) {
                    if (res) {
                        Consumption.updateOne({_id: $stateParams.consId, pull: {Url: item.receiptImg[$index].Url, path: item.receiptImg[$index].path, title: item.receiptImg[$index].title}}).then(function (data) {
                        }, function (err) {
                            $scope.error.receiptError = err.data;
                            console.log(err.data);
                        });
                        item.receiptImg.splice($index, 1);
                        item.receiptImgThumb.splice($index, 1);
                    }
                });
            },
            takePic: function () {
                if (!(window.navigator && window.navigator.camera)) {
                    return console.log('不支持window.navigator.camera');
                }
                $cordovaCamera.getPicture(cameraOptions).then(function (imageURI) {
                    $timeout(function () {
                        var serverUrl = encodeURI(CONFIG.baseUrl + CONFIG.consReceiptUploadPath);
                        uploadOptions.headers = {Authorization: 'Bearer ' + Storage.get('token')};
                        uploadOptions.fileName = $stateParams.consId + CONFIG.uploadOptions.fileExt;
                        uploadOptions.params = {_id: $stateParams.consId};
                        PageFunc.confirm('是否上传?', '上传图片').then(function (res) {
                            if (res) {
                                $ionicLoading.show({
                                    template: '<ion-spinner style="height:2em;width:2em"></ion-spinner>'
                                });
                                if (!window.FileTransfer) {
                                    return console.log('不支持window.FileTransfer');
                                }
                                return $cordovaFileTransfer.upload(serverUrl, imageURI, uploadOptions, true).then(function (result) {
                                    $scope.pageHandler.progress = 0; 
                                    $ionicLoading.hide();
                                    $scope.error.receiptError = '上传成功!'; 
                                    $scope.item.receiptImg = JSON.parse(result.response).results.receiptImg; 
                                    $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                                        if (img) {
                                            img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                                        }
                                        return true;
                                    });
                                    try {
                                        $cordovaCamera.cleanup().then(function () { 
                                        }, function (err) {
                                            console.log(err);
                                        });
                                    }
                                    catch (e) {
                                        console.log(e);
                                    }
                                }, function (err) {
                                    console.log(err);
                                    $scope.error.receiptError = err;
                                    $scope.pageHandler.progress = 0;
                                    $ionicLoading.hide();
                                    try {
                                        $cordovaCamera.cleanup().then(function () { 
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
                            $scope.error.receiptError = '取消上传!';
                            try {
                                $cordovaCamera.cleanup().then(function () { 
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
                    $scope.error.receiptError = err;
                    console.log(err);
                });
            },
            submit: function () {
                PageFunc.confirm('是否提交?', '提交记录').then(function (res) {
                    if (res) {
                        return Consumption.updateOne({_id: $stateParams.consId, set: 'submit'}).then(function (data) {
                            $scope.item = data.results;
                            $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                                if (img) {
                                    img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                                }
                                return true;
                            });
                            $scope.error.receiptError = '提交成功!';
                        }, function (err) {
                            $scope.error.receiptError = err.data;
                            console.log(err.data);
                        });
                    }
                });
            },
            doRefresh: function () {
                init(true)
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            viewer: function ($index, group) {
                var images = group && $scope.item.userId.personalInfo.idImg || $scope.item.receiptImg;
                PageFunc.viewer($scope, images, $index);
            }
        };
        var init = function (refresh) {
            var deferred = $q.defer();
            if ($stateParams.cons && !refresh) {
                $scope.item = $stateParams.cons;
                $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                    if (img) {
                        img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                    }
                    return true;
                });
                $scope.item.idImgThumb = $scope.item.userId.personalInfo.idImg.filter(function (img) {
                    if (img) {
                        img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                    }
                    return true;
                });
                deferred.resolve();
            }
            else {
                Consumption.getOne({_id: $stateParams.consId}).then(function (data) {
                    $scope.item = data.results;
                    $scope.item.receiptImgThumb = $scope.item.receiptImg.filter(function (img) {
                        if (img) {
                            img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                        }
                        return true;
                    });
                    $scope.item.idImgThumb = $scope.item.userId.personalInfo.idImg.filter(function (img) {
                        if (img) {
                            img.urlThumb = img.Url.replace(/\/([^\/]+?\.[^\/]+?)$/, '/thumb/$1'); 
                        }
                        return true;
                    });
                    deferred.resolve();
                }, function (err) {
                    deferred.reject();
                    console.log(err.data);
                });
            }
            return deferred.promise;
        };
        init();
    }])
    .controller('servHome', ['$scope', 'Storage', '$q', 'User', 'PageFunc', function ($scope, Storage, $q, User, PageFunc) {
        User.initInfo($scope);
        $scope.actions = {
            doRefresh: function () {
                User.initInfo($scope)
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            viewer: function ($index) {
                var images = $scope.info.idImgThumb;
                PageFunc.viewer($scope, images, $index);
            }
        };
    }])
    .controller('servMine', ['$scope', '$ionicPopup', '$q', '$ionicActionSheet', '$cordovaCamera', '$cordovaFileTransfer', 'Storage', 'User', '$timeout', 'PageFunc', 'CONFIG', 'Token', function ($scope, $ionicPopup, $q, $ionicActionSheet, $cordovaCamera, $cordovaFileTransfer, Storage, User, $timeout, PageFunc, CONFIG, Token) {
        $scope.config = {
            q1: CONFIG.q1,
            q2: CONFIG.q2,
            q3: CONFIG.q3,
            images: [{title: '工作证正面'}, {title: '工作证反面'}]
        };
        $scope.pageHandler = {
            progress: 0
        };
        $scope.data = {};
        var cameraOptions = angular.copy(CONFIG.cameraOptions), 
            uploadOptions = angular.copy(CONFIG.uploadOptions);
        User.initInfo($scope);
        $scope.actions = {
            doRefresh: function () {
                User.initInfo($scope)
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
            chgHead: function () {
                var hideSheet = $ionicActionSheet.show({
                    buttons: [
                       { text: '<b>拍摄头像</b>' },
                       { text: '相册照片' }
                    ],
                    titleText: '设置头像',
                    cancelText: '取消',
                    cancel: function () {
                    },
                    buttonClicked: function (index) {
                        cameraOptions.allowEdit = true;
                        cameraOptions.targetWidth = 800;
                        cameraOptions.targetHeight = 800;
                        cameraOptions.cameraDirection = 1;
                        switch (index) {
                            case 0: {
                                cameraOptions.sourceType = 1;
                            }
                            break;
                            case 1: {
                                cameraOptions.sourceType = 2;
                            }
                            break;
                        }
                        if (!(window.navigator && window.navigator.camera)) {
                            return console.log('不支持window.navigator.camera');
                        }
                        $cordovaCamera.getPicture(cameraOptions).then(function (imageURI) {
                            $timeout(function () {
                                var serverUrl = encodeURI(CONFIG.baseUrl + CONFIG.userResUploadPath);
                                uploadOptions.headers = {Authorization: 'Bearer ' + Storage.get('token')};
                                uploadOptions.fileName = 'userHead' + CONFIG.uploadOptions.fileExt;
                                uploadOptions.params = {method: '$set', dest: 'head', replace: true}; 
                                PageFunc.confirm('是否上传?', '上传头像').then(function (res) {
                                    if (res) {
                                        if (!window.FileTransfer) {
                                            return console.log('不支持window.FileTransfer');
                                        }
                                        return $cordovaFileTransfer.upload(serverUrl, imageURI, uploadOptions, true).then(function (result) {
                                            $scope.pageHandler.progress = 0;
                                            $scope.info.head = {Url: JSON.parse(result.response).results.Url};
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
                                            console.log(err);
                                            $scope.error.headError = err;
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
                                    $scope.error.headError = '取消上传!';
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
                            $scope.error.headError = err;
                            console.log(err);
                        });
                        return true;
                    }
                });
            },
            chgUsername: function () {
                if ($scope.info.username !== $scope.info.personalInfo.idNo) {
                    return;
                }
                $scope.config.title = '修改用户名';
                $scope.data.key = 'username';
                $scope.data.value = $scope.info.username;
                $scope.actions.show();
            },
            chgMobile: function () {
                var smsType, title, msg;
                if ($scope.info.mobile) {
                    smsType = '-chgBind';
                    title = '修改手机号';
                    msg = '请输入当前绑定手机号';
                }
                else {
                    smsType = '-initBind';
                    title = '绑定手机号';
                    msg = '请输入手机号';
                }
                if ($scope.bindMobileModal) {
                    $scope.bindMobileModal.show();
                }
                else {
                    User.bindMobileModal(Token.curUserRole(), smsType, $scope.info.mobile, title, msg, true);
                }
            },
            chgEmail: function () {
                $scope.config.title = '修改邮箱地址';
                $scope.data.key = 'email';
                $scope.data.value = $scope.info.email;
                $scope.actions.show();
            },
            chgPwd: function () {
                if ($scope.passwordModal) {
                    $scope.passwordModal.show();
                }
                else {
                    User.passwordModal($scope);
                }
            },
            chgPwdQst: function () {
                PageFunc.prompt('登录密码', '请输入登录密码').then(function (res) {
                    if (res) {
                        User.verifyPwd(res).then(function (data) {
                            if (data.results === 'OK') {
                                $scope.config.title = '设置密保问题';
                                if ($scope.pwdQstModal) {
                                    $scope.pwdQstModal.show();
                                }
                                else {
                                    User.pwdQstModal($scope);
                                }
                            }
                        }, function (err) {
                            console.log(err.data);
                        });
                    }
                    else {
                    }
                });
            },
            chgName: function () {
                $scope.config.title = '修改姓名';
                $scope.data.key = 'personalInfo.name';
                $scope.data.value = $scope.info.personalInfo.name;
                $scope.actions.show();
            },
            chgIdNo: function () {
                PageFunc.message('如有错误, 请联系服务专员修改!<br><a ng-href="tel:' + CONFIG.serv400.number + '">' + CONFIG.serv400.caption + '</a>');
            },
            chgLocation: function () {
                $scope.config.title = '修改地址';
                $scope.data.key = 'personalInfo.location.city.name';
                $scope.data.value = $scope.info.personalInfo.location && $scope.info.personalInfo.location.city && $scope.info.personalInfo.location.city.name;
                $scope.actions.show();
            },
            chgIdImg: function () {
                $scope.config.title = '拍摄相关照片';
                if ($scope.takePicsModal) {
                    $scope.takePicsModal.show();
                }
                else {
                    User.takePicsModal($scope, $scope.info.personalInfo.idImg);
                }
            },
            chgIntro: function () {
                $scope.config.title = '修改个人介绍';
                $scope.data.key = 'personalInfo.intro';
                $scope.data.value = $scope.info.personalInfo.intro;
                $scope.actions.show(true);
            },
        };
        $scope.$on('$ionicView.loaded', function () { 
            User.updateModal($scope);
        });
    }])
    .controller('servSettings', ['$scope', '$ionicPopup', '$q', 'Storage', 'User', function ($scope, $ionicPopup, $q, Storage, User) {
        User.initInfo($scope);
        $scope.actions = {
            doRefresh: function () {
                User.initInfo($scope)
                .catch(function (err) { 
                    console.log(err);
                })
                .finally(function () {
                    $scope.$broadcast('scroll.refreshComplete');
                });
            },
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
            logout: function () {
                User.logout($scope);
            }
        };
    }])
    .controller('servHelper', ['$scope', function ($scope) {
    }])
    .controller('servFeedback', ['$scope', function ($scope) {
    }])
    .controller('servSearch', ['$scope', function ($scope) {
    }])
;
