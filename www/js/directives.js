angular.module('yiyangbao.directives', [])
.directive("buttonClearInput", function () {
    return {
        restrict: "AE",
        scope: {
            input: "=" 
        },
        template: "<button ng-if='input' class='button button-icon ion-android-close input-button' type='button' ng-click='clearInput()'></button>",
        controller: function ($scope, $element, $attrs) {
            $scope.clearInput = function () {
                $scope.input = "";
            };
        }
    };
})
.directive('barcodeX', ['$cordovaBarcodeScanner', '$ionicPlatform', '$ionicHistory', 'barcodeXs', 'Token', 'PageFunc', function ($cordovaBarcodeScanner, $ionicPlatform, $ionicHistory, barcodeXs, Token, PageFunc) {
    return {
        restrict: 'AE',
        replace: true,
        template: '<a class="button button-icon icon ion-ios-barcode-outline" on-touch="barcodeX.scan($event)"></a>',
        controller: function ($scope, $element, $attrs) {
            var func = $attrs.func;
            var role = Token.curUserRole();
            $scope.barcodeX = {
                scan: function (event) {
                    if (!(window.cordova && window.cordova.plugins && window.cordova.plugins.barcodeScanner)) {
                        return PageFunc.message('不支持扫码插件!', 1000);
                    }
                    $cordovaBarcodeScanner.scan().then(function (result) { 
                        if (result.cancelled) {
                            $ionicHistory.goBack(0); 
                            return console.log('用户取消!');
                        }
                        barcodeXs.routes(result.text, role, func);
                    }, function (err) {
                        console.log(err);
                        return PageFunc.message(err, 1000);
                    });
                }
            };
        }
    };
}])
.directive('imageonload', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            element.bind('load', function () {
                scope.$apply(attrs.imageonload);
            });
            element.bind('error', function () {
                scope.$apply(attrs.imagefailure);
            });
        }
    };
})
;