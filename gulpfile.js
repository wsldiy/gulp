var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');

gulp.task('default', function () {
    gulp.src('./src/*.js') // 路径问题：gulpfile.js为路径的起点。此路径表示js文件下的所有js文件。
        // .pipe(concat('all.js')) //合并成的js文件名称
        .pipe(uglify({
            compress: {
                warnings: false,
                drop_console: true, // 过滤 console
                drop_debugger: true // 过滤 debugger
            }
        })) //压缩
        .pipe(gulp.dest('dist')); //打包压缩在build目录下。
});