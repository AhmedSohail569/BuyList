import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  View,
  StyleSheet,
} from "react-native";
import PropTypes from "prop-types";
import {RFValue} from "react-native-responsive-fontsize";

const CustomScrollView = React.forwardRef(
  (
    {
      includeAvoidingView = true,
      children,
      contentContainerStyle,
      style,
      ...props
    },
    ref,
  ) => {
    return includeAvoidingView ? (
      <KeyboardAvoidingView
        style={[styles.flex, style]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // adjust if you have headers
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            ref={ref}
            contentContainerStyle={[styles.container, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            {...props}>
            <View style={styles.flex}>{children}</View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    ) : (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={ref}
          contentContainerStyle={[styles.container, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          {...props}>
          <View style={styles.flex}>{children}</View>
        </ScrollView>
      </TouchableWithoutFeedback>
    );
  },
);

CustomScrollView.propTypes = {
  children: PropTypes.node.isRequired,
  contentContainerStyle: PropTypes.object,
  style: PropTypes.object,
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    // paddingVertical: 20,
    paddingHorizontal: RFValue(16),
  },
});

export default CustomScrollView;
