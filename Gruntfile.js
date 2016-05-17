module.exports = function(grunt) {
	require("eyeos-gruntfile")(grunt, "principalService");
    var testFolderPpal="src/test/**/*.test.js";
    grunt.initConfig({
        // Configure a mochaTest task
        mochaTest: {
            unitTest: {
                options: {
                    reporter: 'xunit',
                    ui: 'tdd',
                    quiet: false,
                    timeout: 10000,
                    captureFile: 'build/reports/results.xml'
                },
                src: [testFolderPpal]
            }
        }
    });
};
