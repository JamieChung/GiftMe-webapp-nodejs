module.exports = function(grunt) {

    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json")

        // Uglify JS
        ,
        uglify: {
            options: {},
            dist: {
                files: {
                    "public/js/main.min.js" : ["public/js/main.js"]
                }
            }
        }

        // Compile LESS
        ,
        less: {
            development: {
                options: {
                    compress: true
                },
                files: {
                    "public/css/main.min.css": "public/css/less/main.less",
                }
            }
        }

        // Watch Directories / Files
        ,
        watch: {
            files: ["public/js/*.js", "public/css/less/*.less", "Gruntfile.js"],
            tasks: ["default"]
        }
    });

    // Load the plugin that provides the "uglify" task
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-watch");

    // Default tasks
    grunt.registerTask("default", ["uglify", "less"]);
};