var del = require("del");
var fs = require("fs");
var path = require("path");
var gulp = require("gulp");
var loadPlugins = require("gulp-load-plugins");
var webpack = require("webpack");
var webpackConfig = require("./webpack.config.js");
// require("@babel/register");

// Load all of our Gulp plugins
var $ = loadPlugins();

// Clean up
gulp.task("clean", function (done) {
  del.sync(["./dist", "./dist.zip"]);
  done();
});

// Lint
gulp.task("lint", function () {
  return gulp
    .src("./src/components/main.js")
    .pipe($.plumber())
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failOnError());
});

// Test
gulp.task(
  "test",
  gulp.series("lint", function (done) {
    done();

    return gulp.src(["./tests/**/*.spec.js"], { read: false }).pipe(
      $.mocha({
        reporter: "spec",
        globals: ["sinon", "chai", "expect", "enzyme"],
        require: ["./tests/test-helper.js"],
        compilers: ["js:@babel/register"],
      })
    );
  })
);

// Live Test Watching
gulp.task(
  "test-watch",
  gulp.series("lint", "test", function (done) {
    gulp.watch(
      ["./tests/**/*.spec.js", "./src/components/main.js"],
      gulp.series("lint", "test")
    );

    done();
  })
);

// Build
gulp.task("compile", function () {
  return gulp
    .src("./src/components/main.js")
    .pipe($.babel())
    .pipe(gulp.dest("./dist"));
});
gulp.task("build", gulp.series("lint", "clean", "compile"));

// Build the example into 'docs' so we can ghpages it
gulp.task(
  "build-digitizare",
  // The application build is independent of the legacy StepZilla lint rules.
  gulp.series("clean", "compile", function (done) {
    webpack(webpackConfig, function (err, stats) {
      if (err) return done(err);
      if (stats.hasErrors()) {
        return done(new Error(stats.toString({ all: false, errors: true })));
      }
      try {
        // Finish only after all deployable files have been written. Keep the
        // previous docs bundle available if webpack fails.
        fs.mkdirSync(path.join(__dirname, "docs/dist"), { recursive: true });
        [
          ["src/digitizare/dist/bundle.js", "docs/dist/bundle.js"],
          ["dist/main.js", "docs/main.js"],
          ["src/digitizare/runtime-config.js", "docs/runtime-config.js"],
          ["src/digitizare/index.html", "docs/index.html"],
        ].forEach(function (files) {
          fs.copyFileSync(path.join(__dirname, files[0]), path.join(__dirname, files[1]));
        });
        done();
      } catch (copyError) {
        done(copyError);
      }
    });
  })
);
