var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

var debug = process.env.NODE_ENV !== 'production';

module.exports = {
    entry: path.resolve(__dirname, './src/ts/client.ts'),
    plugins: [
        new HtmlWebpackPlugin({
            templateParameters: {
                title: 'MiniEngein',
            },
            template: path.resolve(__dirname, 'dist/index.html'),
            inject: 'body',
        })
    ],
    output: {
        path: path.join(__dirname, 'dist'),
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.(frag|vert|glsl)$/,
                exclude: '/node_modules/',
                use: [
                    'raw-loader',
                    'glslify-loader'
                ]
            },
            {
                test: /\.(tsx|ts)$/,
                exclude: /node_modules/,
                use: [
                    'ts-loader'
                ]
            },
            {
                test: /\.(scss|sass|css)$/i,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style.css', // アウトプットCSSファイル
        }),
    ],
    devtool: 'source-map',

    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        port: 9000,
    },

    watchOptions: {
        ignored: /node_modules/,
    },
};
