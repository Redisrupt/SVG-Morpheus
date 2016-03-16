'use strict';
var argv         = require('minimist')(process.argv.slice(2)),
    gulp         = require('gulp'),
    header       = require('gulp-header'),
    gutil        = require('gulp-util'),
    refresh      = require('gulp-livereload'),
    prefix       = require('gulp-autoprefixer'),
    uglify       = require('gulp-uglify'),
    clean        = require('gulp-rimraf'),
    concat       = require('gulp-concat-util'),
    express      = require('express'),
    express_lr   = require('connect-livereload'),
    tinylr       = require('tiny-lr'),
    opn          = require('opn'),
    jshint       = require('gulp-jshint'),
    jshintStylish= require('jshint-stylish'),
    pkg          = require('./package.json'),
    lr,
    refresh_lr;

var today = new Date();

// Configuration

var Config = {
  port: 9000,
  livereloadPort: 35728,
  indexPage: 'demos/object.html',
  cache: (typeof argv.cache !== 'undefined' ? !!argv.cache : true),
  paths: {
    demos:    'demos',
    source:   {
      root:   'source',
      js:     'source/js'
    },
    compileUnminified: {
      root:   'compile',
      js:     'compile'
    },
    compileMinified: {
      root:   'compile',
      js:     'compile'
    }
  },
  banners: {
    unminified: '/*!\n' +
                ' * ' + pkg.prettyName + ' v' + pkg.version + '\n' +
                ' * ' + pkg.homepage + '\n' +
                ' *\n' +
                ' * Copyright (c) ' + (today.getFullYear()) + ' ' + pkg.author.name +'\n' +
                ' * License: ' + pkg.license + '\n' +
                ' *\n' +
                ' * Generated at ' + gutil.date(today, 'dddd, mmmm dS, yyyy, h:MM:ss TT') + '\n' +
                ' * forked from https://github.com/alexk111/SVG-Morpheus\n'+
                '*/',
    minified: '/*! ' + pkg.prettyName + ' v' + pkg.version + ' License: ' + pkg.license + ' forked from https://github.com/alexk111/SVG-Morpheus */'
  }
};

// Tasks
// =====

// Compile Scripts
gulp.task('scripts', function(){
  return gulp.src([
      Config.paths.source.js + '/deps/raf.js',
      Config.paths.source.js + '/deps/easings.js',
      Config.paths.source.js + '/deps/helpers.js',
      Config.paths.source.js + '/deps/snapsvglite.js',
      Config.paths.source.js + '/svg-morpheus.js'
    ])
    .pipe(concat('svg-morpheus.js', {
      separator: '\n\n',
      process: function(src) {
        // Remove all 'use strict'; from the code and
        // replaces all double blank lines with one
        return src.replace(/\r\n/g, '\n')
                  .replace(/'use strict';\n+/g, '')
                  .replace(/\n\n\s*\n/g, '\n\n');
      }
    }))
    .pipe(concat.header(Config.banners.unminified + '\n' +
                        'var SVGMorpheus=(function() {\n\'use strict\';\n\n'))
    .pipe(concat.footer('\n}());\n\nif ( typeof module === "object" && module.exports ) {\n  module.exports = SVGMorpheus;\n}\n'))
    .pipe(gulp.dest(Config.paths.compileUnminified.js));
});


// Make a Distrib
gulp.task('dist:js:clean', function(){
  return gulp.src([Config.paths.compileMinified.root + '/**/*'], { read: false })
    .pipe(clean());
});

// gulp.task('dist:js', ['dist:js:clean', 'scripts'], function(){
//   return gulp.src(Config.paths.compileUnminified.js + '/svg-morpheus.js')
//     .pipe(uglify())
//     .pipe(header(Config.banners.minified))
//     .pipe(gulp.dest(Config.paths.compileMinified.js));
// });

// Server
gulp.task('server', function(){
  express()
    .use(express_lr())
    .use(express.static('.'))
    .listen(Config.port);
  gutil.log('Server listening on port ' + Config.port);
});

// LiveReload
gulp.task('livereload', function(){
  lr = tinylr();
  lr.listen(Config.livereloadPort, function(err) {
    if(err) {
      gutil.log('Livereload error:', err);
    }
  });
  refresh_lr=refresh(lr);
});

// Watches
gulp.task('watch', function(){
  gulp.watch([Config.paths.source.js + '/**/*.js'], ['scripts']);
  gulp.watch([
    Config.paths.compileUnminified.js + '/**/*.js',
    Config.paths.demos + '/**/*.*'
  ], function(evt){
    refresh_lr.changed(evt.path);
  });
});


// User commands
// =============

// Code linter
gulp.task('lint', function() {
  return gulp.src(Config.paths.source.js + '/**/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter(jshintStylish));
});

// Build
gulp.task('build', ['dist:js:clean', 'scripts']);

// Start server and watch for changes
gulp.task('default', ['server', 'livereload', 'scripts', 'watch'], function(){
  // use the -o arg to open the test page in the browser
  if(argv.o) {
    opn('http://localhost:' + Config.port+'/'+Config.indexPage);
  }
});