import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
  Alert,
} from "react-native";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import Icon from "react-native-vector-icons/Ionicons";
import { Text } from "~components/Common";
import { RFValue } from "react-native-responsive-fontsize";
import { Mic, ScanLine, Search, Square } from "lucide-react-native";
import { useTheme } from "~context/ThemeContext";
import SpeechRecognizer from "~native/SpeechRecognizer";

const SearchBar = ({
  type = 1,
  title,
  placeholder = "Search...",
  editable = true,
  value,
  onChangeText,
  onSubmitEditing,
  onFocus,
  onPress,
  filterIcon = false,
  style,
  iconColor,
  showSearchButton = false,
  onMicPress,
}) => {
  const { colors, isDark } = useTheme();
  const defaultIconColor = iconColor || colors.iconMuted;
  
  const [isListening, setIsListening] = useState(false);
  const silenceTimer = useRef(null);

  // Clean up speech listener on unmount
  useEffect(() => {
    return () => {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      if (isListening) {
        SpeechRecognizer.stopListening();
      }
    };
  }, [isListening]);

  const handlePress = () => {
    if (!editable && onPress) {
      Keyboard.dismiss();
      onPress();
    }
  };

  const checkPermissionsAndListen = async () => {
    try {
      if (Platform.OS === "android") {
        const status = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
        if (status !== RESULTS.GRANTED) {
          const res = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
          if (res !== RESULTS.GRANTED) {
            Alert.alert("Permission Denied", "Microphone access is required for voice search.");
            return;
          }
        }
      } else if (Platform.OS === "ios") {
        const micStatus = await check(PERMISSIONS.IOS.MICROPHONE);
        if (micStatus !== RESULTS.GRANTED) {
          const micRes = await request(PERMISSIONS.IOS.MICROPHONE);
          if (micRes !== RESULTS.GRANTED) {
             Alert.alert("Permission Denied", "Microphone access is required for voice search.");
             return;
          }
        }
        const speechStatus = await check(PERMISSIONS.IOS.SPEECH_RECOGNITION);
        if (speechStatus !== RESULTS.GRANTED) {
          const speechRes = await request(PERMISSIONS.IOS.SPEECH_RECOGNITION);
          if (speechRes !== RESULTS.GRANTED) {
             Alert.alert("Permission Denied", "Speech recognition access is required for voice search.");
             return;
          }
        }
      }

      await SpeechRecognizer.startListening({
        onStart: () => setIsListening(true),
        onResult: (text, isFinal) => {
          if (onChangeText) onChangeText(text);

          if (silenceTimer.current) {
            clearTimeout(silenceTimer.current);
          }

          if (isFinal) {
             setIsListening(false);
             if (onSubmitEditing) onSubmitEditing();
          } else {
             // 1.5 second silence pause detection
             silenceTimer.current = setTimeout(() => {
               SpeechRecognizer.stopListening();
               setIsListening(false);
               if (onSubmitEditing) onSubmitEditing();
             }, 1500);
          }
        },
        onEnd: () => {
          setIsListening(false);
          if (silenceTimer.current) clearTimeout(silenceTimer.current);
        },
        onError: (err) => {
          setIsListening(false);
          console.log("Speech Error:", err);
          if (silenceTimer.current) clearTimeout(silenceTimer.current);
        }
      });
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (silenceTimer.current) clearTimeout(silenceTimer.current);
      SpeechRecognizer.stopListening();
      setIsListening(false);
    } else {
      checkPermissionsAndListen();
    }
  };

  const Container = editable ? View : TouchableOpacity;

  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: colors.headerBackground },
        style,
      ]}>
      {title && (
        <Text style={[styles.title, { color: colors.textSecondary }]}>
          {title}
        </Text>
      )}

      {type === 1 && (
        <Container
          activeOpacity={0.8}
          onPress={handlePress}
          style={[
            styles.searchContainer,
            { backgroundColor: isDark ? colors.surface : "#F3F4F6" },
          ]}>
          <Icon
            name="search"
            size={20}
            color={defaultIconColor}
            style={{ marginLeft: 10 }}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={placeholder}
            placeholderTextColor={colors.inputPlaceholder}
            editable={editable}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            pointerEvents={editable ? "auto" : "none"}
          />
          {filterIcon && (
            <Icon
              name="funnel"
              size={20}
              color={colors.primary}
              style={{ position: "absolute", right: 15 }}
            />
          )}
          <View style={styles.searchActions}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            {showSearchButton && value?.length >= 3 && (
              <TouchableOpacity onPress={onSubmitEditing}>
                <Search size={20} color={colors.primary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={onMicPress ? onMicPress : (!editable ? toggleListening : null)}>
              {isListening ? (
                <Square size={20} color={colors.error} fill={colors.error} />
              ) : (
                <Mic size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>
        </Container>
      )}

      {type === 2 && (
        <Container
          activeOpacity={0.8}
          onPress={handlePress}
          style={styles.searchRow}>
          <View
            style={[
              styles.searchInputContainer,
              { backgroundColor: isDark ? colors.surface : "#f3f4f6" },
            ]}>
            <Search size={20} color={colors.iconMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={placeholder}
              placeholderTextColor={colors.inputPlaceholder}
              editable={editable}
              value={value}
              onChangeText={onChangeText}
              onSubmitEditing={onSubmitEditing}
              onFocus={onFocus}
              pointerEvents={editable ? "auto" : "none"}
              returnKeyType="search"
            />
          </View>
         {editable && <TouchableOpacity
            onPress={toggleListening}
            style={[
              styles.iconButton,
              { backgroundColor: isDark ? colors.surface : (isListening ? "#fecaca" : "#e0f2fe") },
            ]}>
            {isListening ? (
              <Square size={22} color={colors.error} fill={colors.error} />
            ) : (
              <Mic size={22} color={colors.primary} />
            )}
          </TouchableOpacity>}
          {/* <TouchableOpacity
            style={[
              styles.iconButton,
              styles.scanButton,
              { backgroundColor: isDark ? colors.surface : "#f3f4f6" },
            ]}>
            <ScanLine size={22} color={colors.icon} />
          </TouchableOpacity> */}
        </Container>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: RFValue(12),
    marginBottom: 6,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 30,
    paddingVertical: RFValue(8),
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: RFValue(13),
  },
  searchActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
    gap: 10,
  },
  divider: {
    width: 1,
    height: 20,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  scanButton: {},
});

export default SearchBar;
