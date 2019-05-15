var gulp = require('gulp');
var $ = require('gulp-load-plugins')();

var autoprefixer = require('autoprefixer');
var mainBowerFiles = require('main-bower-files');
var browserSync = require('browser-sync').create();
var minimist = require('minimist');

var envOptions = {
    string: 'env',
    default: {env: 'develop'}
}

var options = minimist(process.argv.slice(2), envOptions)

// gulp.task('copyHTML', function(){
//     return gulp.src('./source/**/*.html')
//     .pipe(gulp.dest('./public/'))
// });

gulp.task('clean', function(){
    return gulp.src(['./.tmp', './public'], { read: false })
        .pipe($.clean());
});

gulp.task('jade', function (){
    gulp.src('./source/**/*.jade')
        .pipe($.plumber())
        .pipe($.jade({
            pretty: true
        }))
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream());
});

gulp.task('sass', function(){
    var plugins = [
        autoprefixer({ browsers: ['last 2 version', '> 5%'] })
    ];
    return gulp.src('./source/sass/**/*.scss')
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass().on('error', $.sass.logError))
        .pipe($.postcss(plugins))
        .pipe($.if(options.env === 'production', $.cleanCss()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/stylesheet'))
        .pipe(browserSync.stream());
});

gulp.task('babel', function(){
    gulp.src('./source/javascript/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('main.js'))
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/javascript'))
        .pipe(browserSync.stream());
});

gulp.task('image-min', function(){
    gulp.src('./source/images/**/')
        .pipe($.if(options.env === 'production', $.imagemin()))
        .pipe(gulp.dest('public/images'))
});

gulp.task('watch', function(){
    gulp.watch('./source/sass/**/*.scss', ['sass']);
    gulp.watch('./source/**/*.jade', ['jade']);
    gulp.watch('./source/**/*.js', ['babel']);
});

gulp.task('stream', function(){
    $.watch(['./source/sass/**/*.scss', './source/**/*.jade', './source/javascript/**/*.js'], function () {
        gulp.start('sass');
        gulp.start('jade');
        gulp.start('babel');
    });
});

gulp.task('bower', function(){
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('./.tmp/vendors/'))
});

gulp.task('vendorJS', ['bower'], function(){
    return gulp.src('./.tmp/vendors/**/*.js')
        .pipe($.order([
            'jquery.js',
            'bootstrap.js'
        ]))
        .pipe($.concat('vendors.js'))
        .pipe($.if(options.env === 'production', $.uglify()))
        .pipe(gulp.dest('./public/javascript/'))
});

gulp.task('browser-sync', function(){
    browserSync.init({
        server: {
            baseDir: './public',
            reloadDebounce: 2000
        }
    });
});

gulp.task('deploy', function(){
    return gulp.src('./public/**/*')
        .pipe($.ghPages());
});

gulp.task('build', $.sequence('clean', 'jade', 'sass', 'babel', 'image-min', 'vendorJS'));
gulp.task('default', ['jade', 'sass', 'watch', 'babel', 'image-min', 'stream', 'vendorJS', 'browser-sync']);