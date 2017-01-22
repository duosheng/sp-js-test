var gulp = require("gulp")
var path = require("path")
var fs=require("fs")
var babel = require("gulp-babel");
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var browserify = require('gulp-browserify');
var jshint= require('gulp-jshint')
var minimist = require('minimist');
js()
js(":r")
gulp.task("default",["js"])


var files=fs.readdirSync("spider");

files.forEach(function(item) {
    var stats=fs.statSync("spider/"+item);
        if (stats.isDirectory()) {
        } else {
            hint(item.substr(0,item.indexOf(".")));
        }
});

function js(type) {
    gulp.task("js" + (type || ""), function () {
        var stream = gulp.src("./spider/*")
            .pipe(jshint())
            .pipe(jshint.reporter("jshint-stylish"))
            .pipe(sourcemaps.init())
            .pipe(babel({
                presets: ['es2015']
            }))
            .pipe(browserify({
                debug: false
            }))
        if (type == ":r") {
            stream = stream.pipe(uglify({
                compress: {warnings: true}
            }));
        }
        stream = stream.pipe(sourcemaps.write("./sources_maps"))
            .pipe(gulp.dest("spider-release"));
        return stream;
    });
}

function hint(fileName) {
    gulp.task("hint:" + fileName, function () {
        var stream = gulp.src("./spider/"+fileName+".js")
            .pipe(jshint())
            .pipe(jshint.reporter("jshint-stylish"))
            .pipe(babel({
                presets: ['es2015']
            }))
            .pipe(browserify({
                debug: false
            }))
        stream = stream.pipe(sourcemaps.write("./sources_maps"))
            .pipe(gulp.dest("spider-release"));
        return stream;
    });
}






