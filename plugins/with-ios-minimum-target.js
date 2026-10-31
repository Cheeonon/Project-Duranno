const { withPodfile } = require('expo/config-plugins');

// Xcode 27 rejects the older resource-bundle targets in AsyncStorage and SVG.
// Keep all Pods at least at Expo SDK 57's iOS minimum, including after prebuild.
module.exports = function withIosMinimumTarget(config) {
  return withPodfile(config, (config) => {
    const marker = '# Duranno: align Pod deployment targets';
    if (config.modResults.contents.includes(marker)) return config;
    const anchor = '  post_install do |installer|';
    if (!config.modResults.contents.includes(anchor)) {
      throw new Error('Cannot locate CocoaPods post_install hook');
    }
    config.modResults.contents = config.modResults.contents.replace(anchor, `${anchor}
    ${marker}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        minimum = Gem::Version.new('16.4')
        current = build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
        if current && Gem::Version.new(current) < minimum
          build_config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = minimum.to_s
        end
      end
    end
`);
    return config;
  });
};
