// Les sources (./src) sont copiées ou buildées dans ./bin
// un --watch
// Source d'inspiration pour rajouter d'autres fonctions (ugly...) : https://github.com/cozy/cozy-proxy/blob/master/client/webpack.config.js

const CopyWebpackPlugin  = require('copy-webpack-plugin')
const ExtractTextPlugin  = require('extract-text-webpack-plugin')
const WebpackShellPlugin = require('webpack-shell-plugin')
// const BrowserSyncWebpack = require('browser-sync-webpack-plugin')

module.exports = {
    entry: "./client/src/main.js",
    output: {
        path    : __dirname + "/client/bin",
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.coffee$/, loader: "coffee-loader" },
            { test: /\.css$/   , loader: "style!css" },
            { test: /\.styl$/  , loader: 'style-loader!css-loader!stylus-loader' },
            { test: /\.jade$/  , loader: "jade-loader" }
        ]
    },
    plugins: [

        // copy ressources in the output directory
        new CopyWebpackPlugin([{from:'client/src/index-dev.html', to:'index.html'}]),
        new CopyWebpackPlugin([{from:'client/src/ressources', to:''}]),
        new WebpackShellPlugin({onBuildStart:['node ./client/prepareWelldoneGif.js']}),
        // bundle the css in a single file called from the html (this way, css hot reload is not possible)
        new ExtractTextPlugin('bundle.css', {allChunks:true}),
        // BrowserSync
        // new BrowserSyncWebpack({
        //     open: false,
        //     server: { baseDir: ['./bin'] }
        // })
    ],
    devtool: 'source-map'
};
