#import "NativeSpeech.h"
#import <Speech/Speech.h>
#import <AVFoundation/AVFoundation.h>

@interface NativeSpeech () <SFSpeechRecognizerDelegate>

@property (nonatomic, strong) SFSpeechRecognizer *speechRecognizer;
@property (nonatomic, strong) SFSpeechAudioBufferRecognitionRequest *recognitionRequest;
@property (nonatomic, strong) SFSpeechRecognitionTask *recognitionTask;
@property (nonatomic, strong) AVAudioEngine *audioEngine;
@property (nonatomic, assign) BOOL isListening;

@end

@implementation NativeSpeech

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
    return @[@"onSpeechStart", @"onSpeechResults", @"onSpeechEnd", @"onSpeechError"];
}

- (instancetype)init {
    if (self = [super init]) {
        _speechRecognizer = [[SFSpeechRecognizer alloc] initWithLocale:[NSLocale currentLocale]];
        _speechRecognizer.delegate = self;
        _audioEngine = [[AVAudioEngine alloc] init];
        _isListening = NO;
    }
    return self;
}

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

RCT_EXPORT_METHOD(startListening:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    if (self.isListening) {
        resolve(@(NO));
        return;
    }

    [SFSpeechRecognizer requestAuthorization:^(SFSpeechRecognizerAuthorizationStatus status) {
        dispatch_async(dispatch_get_main_queue(), ^{
            switch (status) {
                case SFSpeechRecognizerAuthorizationStatusAuthorized:
                    [self startRecording:resolve rejecter:reject];
                    break;
                case SFSpeechRecognizerAuthorizationStatusDenied:
                    reject(@"E_DENIED", @"User denied access to speech recognition", nil);
                    break;
                case SFSpeechRecognizerAuthorizationStatusRestricted:
                    reject(@"E_RESTRICTED", @"Speech recognition restricted on this device", nil);
                    break;
                case SFSpeechRecognizerAuthorizationStatusNotDetermined:
                    reject(@"E_NOT_DETERMINED", @"Speech recognition not yet authorized", nil);
                    break;
            }
        });
    }];
}

RCT_EXPORT_METHOD(stopListening:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
    if (!self.isListening) {
        resolve(@(NO));
        return;
    }
    
    dispatch_async(dispatch_get_main_queue(), ^{
        [self.audioEngine stop];
        [self.recognitionRequest endAudio];
        self.isListening = NO;
        resolve(@(YES));
    });
}

- (void)startRecording:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject {
    if (self.recognitionTask) {
        [self.recognitionTask cancel];
        self.recognitionTask = nil;
    }

    AVAudioSession *audioSession = [AVAudioSession sharedInstance];
    NSError *error;
    [audioSession setCategory:AVAudioSessionCategoryRecord mode:AVAudioSessionModeMeasurement options:AVAudioSessionCategoryOptionDuckOthers error:&error];
    if (error) {
        reject(@"E_AUDIO_SESSION", @"Failed to setup audio session", error);
        return;
    }
    [audioSession setActive:YES withOptions:AVAudioSessionSetActiveOptionNotifyOthersOnDeactivation error:&error];
    if (error) {
        reject(@"E_AUDIO_SESSION", @"Failed to activate audio session", error);
        return;
    }

    self.recognitionRequest = [[SFSpeechAudioBufferRecognitionRequest alloc] init];
    if (!self.recognitionRequest) {
        reject(@"E_REQUEST_FAILED", @"Unable to created a SFSpeechAudioBufferRecognitionRequest object", nil);
        return;
    }
    self.recognitionRequest.shouldReportPartialResults = YES;

    AVAudioInputNode *inputNode = self.audioEngine.inputNode;
    __weak typeof(self) weakSelf = self;
    
    self.recognitionTask = [self.speechRecognizer recognitionTaskWithRequest:self.recognitionRequest resultHandler:^(SFSpeechRecognitionResult * _Nullable result, NSError * _Nullable error) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        BOOL isFinal = NO;
        
        if (result) {
            isFinal = result.isFinal;
            [strongSelf sendEventWithName:@"onSpeechResults" body:@{
                @"text": result.bestTranscription.formattedString,
                @"isFinal": @(isFinal)
            }];
        }
        
        if (error != nil || isFinal) {
            [strongSelf.audioEngine stop];
            [inputNode removeTapOnBus:0];
            strongSelf.recognitionRequest = nil;
            strongSelf.recognitionTask = nil;
            strongSelf.isListening = NO;
            
            if (error) {
                [strongSelf sendEventWithName:@"onSpeechError" body:@{@"error": error.localizedDescription}];
            } else {
                [strongSelf sendEventWithName:@"onSpeechEnd" body:@{@"isFinal": @(YES)}];
            }
        }
    }];

    AVAudioFormat *recordingFormat = [inputNode outputFormatForBus:0];
    [inputNode installTapOnBus:0 bufferSize:1024 format:recordingFormat block:^(AVAudioPCMBuffer * _Nonnull buffer, AVAudioTime * _Nonnull when) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (strongSelf.recognitionRequest) {
            [strongSelf.recognitionRequest appendAudioPCMBuffer:buffer];
        }
    }];

    [self.audioEngine prepare];
    [self.audioEngine startAndReturnError:&error];
    if (error) {
        reject(@"E_AUDIO_ENGINE", @"Audio engine failed to start", error);
        return;
    }

    self.isListening = YES;
    [self sendEventWithName:@"onSpeechStart" body:nil];
    resolve(@(YES));
}

- (void)speechRecognizer:(SFSpeechRecognizer *)speechRecognizer availabilityDidChange:(BOOL)available {
    if (!available) {
        [self sendEventWithName:@"onSpeechError" body:@{@"error": @"Speech recognition unavailable."}];
    }
}

@end
