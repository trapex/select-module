const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');
const ConcatPlugin = require("webpack-concat-plugin");
const path = require("path");


const autoprefixer = require('autoprefixer');

const fs = require('fs');

function fsExistsSync(myDir) {
	try {
		fs.accessSync(myDir);
		return true;
	} catch (e) {
		return false;
	}
}

const isFrontendDirExists = fsExistsSync('frontend');
const SOURCES_DIR = isFrontendDirExists ? './frontend/src' : './src';

const srcDir = path.resolve(__dirname, SOURCES_DIR);
const publicDir = path.resolve(__dirname, './dist');

const IS_DEVELOPMENT = (process.env.NODE_ENV !== 'production');
const IS_PRODUCTION = (process.env.NODE_ENV === 'production');

const BUILD_OUTPUT = process.env.npm_config_build_output || process.env.BUILD_OUTPUT;
const SKIP_HTML = !!process.env.npm_config_skip_html || !!process.env.SKIP_HTML;
const SKIP_IMAGES = !!process.env.npm_config_skip_images || !!process.env.SKIP_IMAGES;

const outputPath = (BUILD_OUTPUT !== "undefined" && BUILD_OUTPUT.length > 0)
	? path.resolve(__dirname, BUILD_OUTPUT)
	: publicDir;

// console.log(typeof process.env.BUILD_OUTPUT !== "undefined" && process.env.BUILD_OUTPUT.length > 0);
console.log(`Running Webpack using configuration below:`);
console.log(`Current ENV -- ${process.env.NODE_ENV}`);
console.log(`Output Directory -- ${outputPath}`);
console.log(`Skip HTML Generation -- ${SKIP_HTML}`);
console.log(`Skip Images Optimization -- ${SKIP_IMAGES}`);

function getEntryPoints() {

	let entries = {
		main: ['@babel/polyfill', `${srcDir}/js/index.js`],
	};

	let regExp = /^index_([a-z0-9]+)\.js$/i;

	fs
		.readdirSync(`${srcDir}/js`)
		.map((bundle) => {
			let [, key,] = bundle.match(regExp) || [];
			if (key) {
				entries = {
					...entries, ...{
						[key]: ['@babel/polyfill', `${srcDir}/js/${bundle}`]
					}
				}
			}
		});

	return entries;
}

function buildConfig() {

	// base configuration
	let config = {
		entry: getEntryPoints(),
		output: {
			path: outputPath,
			filename: 'js/[name].bundle.js?[hash:7]',
			chunkFilename: 'js/[name].chunk.js?[hash:7]',
		},
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: /node_modules/,
					use: [{
						loader: "babel-loader",
						options: {
							presets: [[
								"@babel/preset-env", {
									targets: {
										browsers: [
											'Chrome >= 42',
											'Safari >= 10.1',
											'iOS >= 10.3',
											'Firefox >= 50',
											'Edge >= 12',
											'ie >= 10',
										],
									}
					}
							]]
						}
					}]
				},
				{
					test: /\.html$/,
					use: [
						{
							loader: "html-loader",
							options: {minimize: true}
						}
					]
				},
				{
					test: /\.scss$/,
					use: [
						IS_DEVELOPMENT ? {
							loader: 'style-loader',
							options: {}
						} : {
							loader: MiniCssExtractPlugin.loader,
							options: {
								publicPath: '../'
							}
						},
						{
							loader: 'css-loader',
							options: {
								sourceMap: false,
								minimize: IS_PRODUCTION,
							}
						},
						{
							loader: 'postcss-loader',
							options: {
								plugins: [
									autoprefixer({
										browsers:['ie >= 8', 'last 4 version']
									})
								]
							}
						},
						"sass-loader",
					]
				},
				{
					test: /\.pug$/,
					use: [
						{
							loader: "html-loader",
							options: {
								attrs: ['img:src', 'link:href', ':data-src']
							}
						},
						// "file-loader?name=[path][name].html",
						// "extract-loader",
						{
							loader: "pug-html-loader",
							options: {
								data: {
									ENV: IS_DEVELOPMENT ? 'development' : 'production'
								}
							}
						}
					]
				},
				{
					test: /\.(jpe?g|png|gif|svg)$/,
					use: [
						{
							loader: 'url-loader',
							options: {
								limit: 8192,
								name: '[name].[ext]?[hash:7]',
								useRelativePath: true
							}
						},
						{
							loader: 'image-webpack-loader',
							options: {
								disable: IS_DEVELOPMENT || SKIP_IMAGES,
								mozjpeg: {
									progressive: true,
									quality: 65
								},
								optipng: {
									enabled: false,
								},
								pngquant: {
									quality: '65-90',
									speed: 4
								},
								gifsicle: {
									interlaced: false,
								},
							},
						}
					]
				},
				{
					test: /\.(woff2?|ttf|eot)$/,
					use: [
						{
							loader: 'url-loader',
							options: {
								limit: 8192,
								outputPath: 'fonts',
								name: '[name].[ext]?[hash:7]',
							}
						},
					]
				}
			]
		},
		mode: IS_PRODUCTION ? 'production' : 'development',
		plugins: [],
		resolve: {}
	};

	if (!SKIP_HTML) {

		// getting all *.pug templates
		let templates = fs.readdirSync(srcDir).filter(file => (/\.pug$/i).test(file));

		// pushing pug2html plugins for templates
		templates.map((filename) => {
			config.plugins.push(new HtmlWebpackPlugin({
				template: path.resolve(srcDir, filename),
				filename: filename.replace(/\.[^/.]+$/, '.html'),
				inject: false
			}));
		});
	}

	// pushing css-extract plugin
	config.plugins.push(new MiniCssExtractPlugin({
		filename: "css/[name].css?[hash:7]",
		chunkFilename: "[id].css"
	}));

	// getting vendor js
	let vendorLibs = [];
	fs.readdirSync(`${srcDir}/js/vendor`).filter(file => (/\.js$/i).test(file))
		.map((filename) => {
			vendorLibs.push(`${srcDir}/js/vendor/${filename}`);
		});

	// pushing concat-vendor-js plugin
	if (vendorLibs.length > 0) {
		config.plugins.push(new ConcatPlugin({
			uglify: IS_PRODUCTION,
			sourceMap: false,
			name: 'vendor',
			outputPath: 'js',
			fileName: '[name].js?[hash:7]',
			filesToConcat: vendorLibs,
			attributes: {
				async: true
			}
		}));
	}

	// pushing copy plugin
	config.plugins.push(new CopyWebpackPlugin([
		{from: '**/*', to: '.'},
	], {
		context: `${srcDir}/static`,
	}));

	// taking care of images
	if (SKIP_HTML) {
		config.plugins.push(
			new CopyWebpackPlugin([{
				from: path.resolve(__dirname, `${srcDir}/img`),
				to: path.resolve(outputPath, 'img')
			}]),
			new ImageminPlugin({
				disable: IS_DEVELOPMENT || SKIP_IMAGES,
				test: /\.(jpe?g|png|gif|svg)$/i,
				plugins: [
					imageminMozjpeg({
						quality: 65,
						progressive: true
					})
				],
				jpegtran: null,
				optipng: null,
				pngquant: {
					quality: '65-90',
					speed: 4
				},
				gifsicle: {
					interlaced: false,
				},
			})
		);
	}

	// define (env) vars plugin
	config.plugins.push(new webpack.DefinePlugin({
		IS_PRODUCTION: JSON.stringify(IS_PRODUCTION),
		IS_DEVELOPMENT: JSON.stringify(IS_DEVELOPMENT),
		'process.env': {
			NODE_ENV: JSON.stringify(process.env.NODE_ENV)
		},
	}));

	return config;
}

module.exports = buildConfig;