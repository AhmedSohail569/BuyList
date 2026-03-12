require "json"

package = JSON.parse(File.read(File.join(__dir__, "../../package.json")))

Pod::Spec.new do |s|
  s.name         = "NativeSpeech"
  s.version      = package["version"]
  s.summary      = "Native Speech Recognition for iOS"
  s.homepage     = "https://github.com/buylist"
  s.license      = "MIT"
  s.authors      = { "BuyList" => "buylist@example.com" }
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/buylist.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.requires_arc = true

  s.dependency "React-Core"
end
