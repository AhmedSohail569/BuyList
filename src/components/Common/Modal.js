import {useState, useEffect, useRef} from "react";
import {
  StyleSheet,
  Dimensions,
  Modal,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
  TextInput,
  Switch,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import {X, Plus, ChevronDown, Users, Check} from "lucide-react-native";
import {RFValue} from "react-native-responsive-fontsize";
import {Text} from "~components/Common";
import {FontFamily} from "~theme/fonts";
import {useTheme} from "~context/ThemeContext";
import useTranslation from "~hooks/useTranslation";
import {useSelector, useDispatch} from "react-redux";
import {fetchCirclesPicker, createCircle} from "~redux/actions/circleActions";

const {width, height} = Dimensions.get("window");

export const BottomModal = ({
  isVisible,
  onClose,
  onApply,
  type = "filter", // 'filter' | 'createList' | 'createCircle'
  loading = false,
}) => {
  const {colors, isDark} = useTheme();
  const {t} = useTranslation();
  const dispatch = useDispatch();
  const {pickerCircles, pickerLoading} = useSelector(
    state => state.circles || {},
  );

  const CIRCLE_COLORS = [
    "#0EA5E9",
    "#EF4444",
    "#6B7280",
    "#22C55E",
    "#0369A1",
    "#FACC15",
    "#A855F7",
    "#F97316",
    "#EA580C",
    "#EC4899",
    "#F87171",
    "#2563EB",
    "#166534",
    "#B91C1C",
    "#92400E",
    "#4F46E5",
    "#BE185D",
    "#0284C7",
    "#C084FC",
    "#1F2937",
  ];

  // --- STATE: Filter Mode ---
  const [selectedSort, setSelectedSort] = useState("Relevance");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("100+");

  // --- STATE: Create List Mode ---
  const [listName, setListName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Groceries");
  const [newItem, setNewItem] = useState("");
  const [items, setItems] = useState([]);
  const [priority, setPriority] = useState("medium");
  const [isShared, setIsShared] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showCircleDropdown, setShowCircleDropdown] = useState(false);
  const [circleDropdownDirection, setCircleDropdownDirection] =
    useState("down");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCircleId, setSelectedCircleId] = useState(null);

  // --- STATE: Create Circle Sub-Modal (inside createList flow) ---
  const [showCreateCircleSubModal, setShowCreateCircleSubModal] = useState(false);
  const [subCircleName, setSubCircleName] = useState("");
  const [subCircleColor, setSubCircleColor] = useState(CIRCLE_COLORS[0]);
  const [subCircleCreating, setSubCircleCreating] = useState(false);

  // --- STATE: Create Circle Mode ---
  const [circleName, setCircleName] = useState("");
  const [selectedColor, setSelectedColor] = useState(CIRCLE_COLORS[0]);

  // --- STATE: Keyboard Management ---
  const [avoidKeyboard, setAvoidKeyboard] = useState(true);

  // --- Error States ---
  const [listNameError, setListNameError] = useState("");
  const [itemsError, setItemsError] = useState("");

  // --- Refs ---
  const scrollViewRef = useRef(null);
  const circleDropdownRef = useRef(null);

  // --- CONSTANTS ---
  const sortOptions = [
    "Relevance",
    "Price: Low to High",
    "Price: High to Low",
    "Distance",
  ];

  const categoryOptions = [
    "Groceries",
    "Home",
    "Work",
    "Gifts",
    "Health",
    "Other",
  ];

  const priorityOptions = [
    {label: "Low", value: "low"},
    {label: "Medium", value: "medium"},
    {label: "High", value: "high"},
  ];

  // --- HANDLERS ---
  const handleResetFilter = () => {
    setSelectedSort("Relevance");
    setMinPrice("0");
    setMaxPrice("100+");
  };

  // Reset form when modal closes
  useEffect(() => {
    if (!isVisible && type === "createList") {
      setListName("");
      setSelectedCategory("Groceries");
      setNewItem("");
      setItems([]);
      setPriority("medium");
      setIsShared(false);
      setSelectedCircleId(null);
      setShowPriorityDropdown(false);
      setShowCircleDropdown(false);
      setListNameError("");
      setItemsError("");
      setShowCreateCircleSubModal(false);
      setSubCircleName("");
      setSubCircleColor(CIRCLE_COLORS[0]);
    }
    if (!isVisible && type === "createCircle") {
      setCircleName("");
      setSelectedColor(CIRCLE_COLORS[0]);
    }
  }, [isVisible, type]);

  const handleCreateSubCircle = async () => {
    if (!subCircleName.trim() || subCircleCreating) return;
    setSubCircleCreating(true);
    try {
      const result = await dispatch(
        createCircle({name: subCircleName.trim(), color: subCircleColor}),
      ).unwrap();
      dispatch(fetchCirclesPicker());
      const newId = result?._id || result?.id || result?.circle?._id;
      if (newId) setSelectedCircleId(newId);
      setShowCreateCircleSubModal(false);
      setSubCircleName("");
      setSubCircleColor(CIRCLE_COLORS[0]);
    } catch {
      // error handled by Redux / toast upstream
    } finally {
      setSubCircleCreating(false);
    }
  };

  const handleAddItem = () => {
    const trimmedItem = newItem.trim();
    if (!trimmedItem) return;

    if (items.some(i => i.name === trimmedItem)) {
      setItemsError(`"${trimmedItem}" is already in the list`);
      return;
    }

    setItems([...items, {name: trimmedItem, priority: "medium"}]);
    setNewItem("");
    if (itemsError) setItemsError("");
  };

  const handleRemoveItem = index => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleItemPriority = (index, p) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? {...item, priority: p} : item)),
    );
  };

  const handleCreateList = async () => {
    let hasError = false;

    // Validate required fields
    if (!listName.trim()) {
      setListNameError(t("lists_validation_name"));
      hasError = true;

      // Auto-scroll to top so the list name error is visible
      scrollViewRef.current?.scrollTo({y: 0, animated: true});
    }

    if (items.length === 0) {
      setItemsError(t("lists_validation_items"));
      hasError = true;
    }

    if (hasError) return;

    if (isSubmitting || loading) return;
    setIsSubmitting(true);

    try {
      // Await parent handler so we can prevent double submit.
      await Promise.resolve(
        onApply({
          name: listName.trim(),
          category: selectedCategory,
          items: items.map(item => ({
            name: item.name,
            priority: item.priority,
          })),
          priority: priority,
          shareWithCircle: isShared,
          circleId: isShared ? selectedCircleId : undefined,
        }),
      );
      // Parent closes modal on success; this keeps behavior consistent.
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCircle = async () => {
    if (!circleName.trim()) return;
    if (isSubmitting || loading) return;

    setIsSubmitting(true);
    try {
      await Promise.resolve(
        onApply({
          name: circleName.trim(),
          color: selectedColor,
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER CONTENT ---
  const renderFilterContent = () => (
    <>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>
          {t("modal_filters_title")}
        </Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={24} color={colors.iconMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
        {/* Sort Section */}
        <Text style={[styles.sectionLabel, {color: colors.textMuted}]}>
          {t("modal_sort_label")}
        </Text>
        <View style={styles.chipsContainer}>
          {sortOptions.map(option => {
            const isActive = selectedSort === option;
            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? colors.textPrimary
                        : "#000000"
                      : colors.modalBackground,
                    borderColor: isActive
                      ? isDark
                        ? colors.textPrimary
                        : "#000000"
                      : colors.border,
                  },
                ]}
                onPress={() => setSelectedSort(option)}>
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isActive
                        ? isDark
                          ? colors.background
                          : "#ffffff"
                        : colors.textSecondary,
                    },
                  ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Price Range Section */}
        <Text style={[styles.sectionLabel, {color: colors.textMuted}]}>
          {t("modal_price_label")}
        </Text>
        <View style={styles.priceRow}>
          <View
            style={[
              styles.priceInputContainer,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}>
            <Text style={[styles.currencyPrefix, {color: colors.textMuted}]}>
              $
            </Text>
            <TextInput
              style={[styles.priceInput, {color: colors.textPrimary}]}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="numeric"
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
          <Text style={[styles.priceSeparator, {color: colors.textMuted}]}>
            –
          </Text>
          <View
            style={[
              styles.priceInputContainer,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}>
            <Text style={[styles.currencyPrefix, {color: colors.textMuted}]}>
              $
            </Text>
            <TextInput
              style={[styles.priceInput, {color: colors.textPrimary}]}
              value={maxPrice}
              onChangeText={setMaxPrice}
              placeholderTextColor={colors.inputPlaceholder}
            />
          </View>
        </View>

        {/* Footer Buttons - Moved inside scroll */}
        <View style={[styles.modalFooter, {marginTop: 10}]}>
          <TouchableOpacity
            style={[
              styles.resetButton,
              {backgroundColor: colors.surfaceSecondary},
            ]}
            onPress={handleResetFilter}>
            <Text style={[styles.resetButtonText, {color: colors.textPrimary}]}>
              {t("modal_reset")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyButton, {backgroundColor: colors.primary}]}
            onPress={() => {
              onApply({sort: selectedSort, minPrice, maxPrice});
              onClose();
            }}>
            <Text style={styles.applyButtonText}>
              {t("modal_show_results")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  const renderCreateListContent = () => (
    <>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>
          {t("modal_new_list")}
        </Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={24} color={colors.iconMuted} />
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
        {/* List Name */}
        <Text style={[styles.inputLabel, {color: colors.textMuted}]}>
          {t("modal_list_name")} <Text style={{color: "#ef4444"}}>*</Text>
        </Text>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: listNameError ? "#ef4444" : colors.border,
              marginBottom: listNameError ? 4 : 20,
            },
          ]}>
          <TextInput
            style={[styles.textInput, {color: colors.textPrimary}]}
            placeholder={t("modal_list_name_placeholder")}
            placeholderTextColor={colors.inputPlaceholder}
            value={listName}
            onFocus={() => setAvoidKeyboard(false)}
            onBlur={() => setAvoidKeyboard(true)}
            onChangeText={text => {
              setListName(text);
              if (listNameError) setListNameError("");
            }}
          />
        </View>
        {listNameError ? (
          <Text style={styles.errorText}>{listNameError}</Text>
        ) : null}

        {/* Category */}
        <Text style={[styles.inputLabel, {color: colors.textMuted}]}>
          {t("modal_category")}
        </Text>
        <View style={styles.chipsContainer}>
          {categoryOptions.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isActive
                      ? isDark
                        ? "rgba(14, 165, 233, 0.2)"
                        : "#eff6ff"
                      : colors.modalBackground,
                    borderColor: isActive
                      ? isDark
                        ? "rgba(14, 165, 233, 0.3)"
                        : "#eff6ff"
                      : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(cat)}>
                <Text
                  style={[
                    styles.categoryChipText,
                    {color: isActive ? colors.primary : colors.textSecondary},
                  ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Share with Circle Toggle */}
        <View style={[styles.divider, {backgroundColor: colors.divider}]} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(14, 165, 233, 0.2)"
                    : "#eff6ff",
                },
              ]}>
              <Users size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.toggleTitle, {color: colors.textPrimary}]}>
                {t("modal_share")}
              </Text>
              <Text style={[styles.toggleSubtitle, {color: colors.textMuted}]}>
                {t("modal_share_circle_subtitle")}
              </Text>
            </View>
          </View>
          <Switch
            trackColor={{false: colors.border, true: colors.primary}}
            thumbColor={"#ffffff"}
            ios_backgroundColor={colors.border}
            onValueChange={val => {
              setIsShared(val);
              setSelectedCircleId(null);
              if (val) dispatch(fetchCirclesPicker());
            }}
            value={isShared}
            style={styles.switch}
          />
        </View>

        {/* Circle Picker — shown only when sharing is on */}
        {isShared && (
          <View style={styles.dropdownContainer}>
            {pickerLoading ? (
              <Text
                style={[
                  styles.circlePickerLoading,
                  {color: colors.textMuted, marginLeft: 0, marginBottom: 16},
                ]}>
                {t("modal_share_loading")}
              </Text>
            ) : pickerCircles.length === 0 ? (
              <>
                <Text
                  style={[
                    styles.circlePickerLoading,
                    {color: colors.textMuted, marginLeft: 0, marginBottom: 12},
                  ]}>
                  {t("modal_share_no_circles")}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.newCircleBtn,
                    {borderColor: colors.primary},
                  ]}
                  onPress={() => setShowCreateCircleSubModal(true)}>
                  <Plus size={14} color={colors.primary} />
                  <Text style={[styles.newCircleBtnText, {color: colors.primary}]}>
                    New Circle
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  ref={circleDropdownRef}
                  style={[
                    styles.dropdownInput,
                    {
                      backgroundColor: colors.surfaceSecondary,
                      borderColor: colors.border,
                      marginBottom: 10,
                    },
                  ]}
                  onPress={() => {
                    if (!showCircleDropdown) {
                      circleDropdownRef.current?.measureInWindow(
                        (_x, y, _w, h) => {
                          const spaceBelow = height - (y + h);
                          setCircleDropdownDirection(
                            spaceBelow >= 220 ? "down" : "up",
                          );
                        },
                      );
                    }
                    setShowCircleDropdown(!showCircleDropdown);
                  }}>
                  <Text
                    style={[
                      styles.inputText,
                      {
                        color: selectedCircleId
                          ? colors.textPrimary
                          : colors.textSecondary,
                      },
                    ]}>
                    {selectedCircleId
                      ? pickerCircles.find(c => c._id === selectedCircleId)
                          ?.name
                      : t("modal_share_select_circle")}
                  </Text>
                  <ChevronDown
                    size={20}
                    color={colors.iconMuted}
                    style={{
                      transform: [
                        {rotate: showCircleDropdown ? "180deg" : "0deg"},
                      ],
                    }}
                  />
                </TouchableOpacity>

                {showCircleDropdown && (
                  <>
                    <TouchableWithoutFeedback
                      onPress={() => setShowCircleDropdown(false)}>
                      <View style={styles.dropdownBackdrop} />
                    </TouchableWithoutFeedback>
                    <View
                      style={[
                        styles.dropdownMenu,
                        {
                          backgroundColor: colors.modalBackground,
                          borderColor: colors.border,
                        },
                        circleDropdownDirection === "down"
                          ? {top: 52, bottom: null}
                          : {bottom: 52, top: null},
                      ]}>
                      <ScrollView
                        style={{maxHeight: 200}}
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}>
                        {pickerCircles.map(circle => {
                          const isSelected = selectedCircleId === circle._id;
                          return (
                            <TouchableOpacity
                              key={circle._id}
                              style={[
                                styles.dropdownOption,
                                {
                                  borderBottomColor: colors.divider,
                                  flexDirection: "row",
                                  alignItems: "center",
                                },
                                isSelected && {
                                  backgroundColor: isDark
                                    ? "rgba(14, 165, 233, 0.15)"
                                    : "#eff6ff",
                                },
                              ]}
                              onPress={() => {
                                setSelectedCircleId(
                                  isSelected ? null : circle._id,
                                );
                                setShowCircleDropdown(false);
                              }}>
                              <View
                                style={[
                                  styles.circleColorDot,
                                  {
                                    backgroundColor:
                                      circle.color || colors.primary,
                                    marginRight: 8,
                                  },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.dropdownOptionText,
                                  {
                                    flex: 1,
                                    color: isSelected
                                      ? colors.primary
                                      : colors.textPrimary,
                                  },
                                ]}
                                numberOfLines={1}>
                                {circle.name}
                              </Text>
                              {isSelected && (
                                <Check size={16} color={colors.primary} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.newCircleBtn, {borderColor: colors.primary, marginBottom: 6}]}
                  onPress={() => setShowCreateCircleSubModal(true)}>
                  <Plus size={14} color={colors.primary} />
                  <Text style={[styles.newCircleBtnText, {color: colors.primary}]}>
                    New Circle
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Add Items */}
        <Text style={[styles.inputLabel, {color: colors.textMuted}]}>
          {t("modal_add_items")} <Text style={{color: "#ef4444"}}>*</Text>
        </Text>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: itemsError ? "#ef4444" : colors.border,
              marginBottom: 12,
            },
          ]}>
          <TextInput
            style={[styles.textInput, {color: colors.textPrimary}]}
            placeholder={t("modal_add_item_placeholder")}
            placeholderTextColor={colors.inputPlaceholder}
            value={newItem}
            onFocus={() => setAvoidKeyboard(true)}
            onChangeText={setNewItem}
            onSubmitEditing={handleAddItem}
            returnKeyType="done"
            maxLength={50}
          />
          <TouchableOpacity
            style={[
              styles.plusIconBadge,
              {
                backgroundColor: newItem.trim()
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={handleAddItem}
            disabled={!newItem.trim()}>
            <Plus
              size={16}
              color={newItem.trim() ? "#ffffff" : colors.iconMuted}
            />
          </TouchableOpacity>
        </View>

        {itemsError ? <Text style={styles.errorText}>{itemsError}</Text> : null}

        {/* Display Added Items */}
        {items.length > 0 && (
          <View
            style={[
              styles.itemsContainerList,
              {
                borderColor: colors.divider,
                backgroundColor: colors.surfaceSecondary,
              },
            ]}>
            {items.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.itemListItem,
                  {borderBottomColor: colors.divider},
                  index === items.length - 1 && {borderBottomWidth: 0},
                ]}>
                <Text
                  style={[styles.itemListItemText, {color: colors.textPrimary}]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {item.name}
                </Text>
                <View style={styles.itemPriorityRow}>
                  {["low", "medium", "high"].map(p => {
                    const isActive = item.priority === p;
                    const color =
                      p === "high"
                        ? "#EF4444"
                        : p === "medium"
                        ? "#FFFFFF"
                        : "#16A34A";
                    const bgActive =
                      p === "high"
                        ? "#EF44441F"
                        : p === "medium"
                        ? "#1E9DF1"
                        : "#16A34A1F";
                    return (
                      <TouchableOpacity
                        key={p}
                        onPress={() => handleItemPriority(index, p)}
                        style={[
                          styles.itemPriorityBtn,
                          isActive && {backgroundColor: bgActive},
                          !isActive && {
                            borderColor: colors.border,
                            backgroundColor: colors.surfaceSecondary,
                          },
                        ]}>
                        <Text
                          style={[
                            styles.itemPriorityText,
                            {color: isActive ? color : colors.textMuted},
                          ]}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => handleRemoveItem(index)}
                    hitSlop={8}>
                    <X size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Set Priority */}
        <Text style={[styles.inputLabel, {color: colors.textMuted}]}>
          {t("modal_set_priority")}
        </Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[
              styles.dropdownInput,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setShowPriorityDropdown(!showPriorityDropdown)}>
            <Text style={[styles.inputText, {color: colors.textSecondary}]}>
              {t(
                "modal_priority_" +
                  (priorityOptions.find(opt => opt.value === priority)?.value ||
                    "medium"),
              )}
            </Text>
            <ChevronDown
              size={20}
              color={colors.iconMuted}
              style={{
                transform: [{rotate: showPriorityDropdown ? "180deg" : "0deg"}],
              }}
            />
          </TouchableOpacity>

          {showPriorityDropdown && (
            <>
              <TouchableWithoutFeedback
                onPress={() => setShowPriorityDropdown(false)}>
                <View style={styles.dropdownBackdrop} />
              </TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    backgroundColor: colors.modalBackground,
                    borderColor: colors.border,
                  },
                ]}>
                {priorityOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOption,
                      {borderBottomColor: colors.divider},
                      priority === option.value && {
                        backgroundColor: isDark
                          ? "rgba(14, 165, 233, 0.15)"
                          : "#eff6ff",
                      },
                    ]}
                    onPress={() => {
                      setPriority(option.value);
                      setShowPriorityDropdown(false);
                    }}>
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        {
                          color:
                            priority === option.value
                              ? colors.primary
                              : colors.textMuted,
                        },
                      ]}>
                      {t("modal_priority_" + option.value)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Footer Button - Moved inside scroll */}
        <View style={[styles.modalFooterSingle, {marginTop: 10}]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              {backgroundColor: colors.primary},
              (loading || isSubmitting) && styles.createButtonDisabled,
            ]}
            onPress={handleCreateList}
            disabled={loading || isSubmitting}>
            <Text style={styles.createButtonText}>
              {loading || isSubmitting
                ? t("modal_creating_list")
                : t("modal_create_list")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Create Circle Sub-Modal — stacked on top of the create list modal */}
      <Modal
        visible={showCreateCircleSubModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateCircleSubModal(false)}>
        <KeyboardAvoidingView
          behavior="height"
          style={[styles.modalOverlay, {backgroundColor: colors.modalOverlay}]}
          enabled>
          <TouchableWithoutFeedback onPress={() => setShowCreateCircleSubModal(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.modalContent,
              {backgroundColor: colors.modalBackground, shadowColor: colors.shadowColor},
            ]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>
                {t("circle_create_title")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateCircleSubModal(false)}
                hitSlop={10}>
                <X size={24} color={colors.iconMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
              {/* Circle Name */}
              <Text style={[styles.inputLabel, {color: colors.textMuted, marginBottom: 8}]}>
                {t("circle_create_name_label")}
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: colors.surfaceSecondary,
                    borderColor: colors.border,
                    marginBottom: 20,
                  },
                ]}>
                <TextInput
                  style={[styles.textInput, {color: colors.textPrimary}]}
                  placeholder={t("circle_create_name_placeholder")}
                  placeholderTextColor={colors.inputPlaceholder}
                  value={subCircleName}
                  onChangeText={setSubCircleName}
                  autoFocus
                />
              </View>

              {/* Color Grid */}
              <Text style={[styles.inputLabel, {color: colors.textMuted, marginBottom: 10}]}>
                {t("circle_create_color_label")}
              </Text>
              <View style={styles.colorGrid}>
                {CIRCLE_COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, {backgroundColor: color}]}
                    onPress={() => setSubCircleColor(color)}>
                    {subCircleColor === color && (
                      <Check size={RFValue(14)} color="#fff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.modalFooterSingle, {marginTop: 20}]}>
                <TouchableOpacity
                  style={[
                    styles.createButton,
                    {backgroundColor: colors.primary},
                    (subCircleCreating || !subCircleName.trim()) &&
                      styles.createButtonDisabled,
                  ]}
                  onPress={handleCreateSubCircle}
                  disabled={subCircleCreating || !subCircleName.trim()}>
                  <Text style={styles.createButtonText}>
                    {subCircleCreating
                      ? t("circle_create_btn_loading")
                      : t("circle_create_btn")}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );

  const renderCreateCircleContent = () => (
    <>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, {color: colors.textPrimary}]}>
          {t("circle_create_title")}
        </Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={24} color={colors.iconMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{flexGrow: 1, paddingBottom: 20}}>
        {/* Circle Name */}
        <Text
          style={[
            styles.inputLabel,
            {color: colors.textMuted, marginBottom: 8},
          ]}>
          {t("circle_create_name_label")}
        </Text>
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              marginBottom: 20,
            },
          ]}>
          <TextInput
            style={[styles.textInput, {color: colors.textPrimary}]}
            placeholder={t("circle_create_name_placeholder")}
            placeholderTextColor={colors.inputPlaceholder}
            value={circleName}
            onFocus={() => setAvoidKeyboard(true)}
            // onBlur={() => setAvoidKeyboard(false)}
            onChangeText={setCircleName}
            autoFocus
          />
        </View>

        {/* Color Grid */}
        <Text
          style={[
            styles.inputLabel,
            {color: colors.textMuted, marginBottom: 10},
          ]}>
          {t("circle_create_color_label")}
        </Text>
        <View style={styles.colorGrid}>
          {CIRCLE_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[styles.colorOption, {backgroundColor: color}]}
              onPress={() => setSelectedColor(color)}>
              {selectedColor === color && (
                <Check size={RFValue(14)} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer Button - included inside scroll to ensure it's pushable by keyboard if needed */}
        <View style={[styles.modalFooterSingle, {marginTop: 20}]}>
          <TouchableOpacity
            style={[
              styles.createButton,
              {backgroundColor: colors.primary},
              (loading || isSubmitting || !circleName.trim()) &&
                styles.createButtonDisabled,
            ]}
            onPress={handleCreateCircle}
            disabled={loading || isSubmitting || !circleName.trim()}>
            <Text style={styles.createButtonText}>
              {loading || isSubmitting
                ? t("circle_create_btn_loading")
                : t("circle_create_btn")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior="height"
        style={[styles.modalOverlay, {backgroundColor: colors.modalOverlay}]}
        enabled={avoidKeyboard}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.modalBackground,
              shadowColor: colors.shadowColor,
            },
          ]}>
          {type === "createList"
            ? renderCreateListContent()
            : type === "createCircle"
            ? renderCreateCircleContent()
            : renderFilterContent()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // --- Modal Structure ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    width: width,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    maxHeight: height * 0.85,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: RFValue(16),
    fontFamily: FontFamily.bold,
  },

  // --- Filter Mode Styles ---
  sectionLabel: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#6b7280",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  chipActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  chipText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    color: "#374151",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  currencyPrefix: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#9ca3af",
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    color: "#111827",
    paddingVertical: 0,
  },
  priceSeparator: {
    marginHorizontal: 12,
    color: "#9ca3af",
    fontSize: 20,
  },

  // --- Create List Mode Styles ---
  inputLabel: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.bold,
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    justifyContent: "center",
    position: "relative",
  },
  errorText: {
    color: "#ef4444",
    fontSize: RFValue(11),
    fontFamily: FontFamily.medium,
    marginBottom: 16,
    marginLeft: 4,
  },
  textInput: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#111827",
    paddingRight: 40, // Space for button inside input
  },
  plusIconBadge: {
    position: "absolute",
    right: 8,
    backgroundColor: "#e5e7eb", // Light grey badge
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  plusIconBadgeActive: {
    backgroundColor: "#0ea5e9", // Blue when active
  },
  itemsContainerList: {
    flexDirection: "column",
    marginTop: -4,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  itemListItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemListItemText: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
    marginRight: 8,
  },
  itemPriorityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemPriorityBtn: {
    paddingHorizontal: 12,
    paddingVertical: 0,
    borderRadius: 6,
  },
  itemPriorityText: {
    fontSize: RFValue(8),
    fontFamily: FontFamily.bold,
  },
  dropdownContainer: {
    marginBottom: 20,
    position: "relative",
    zIndex: 1,
  },
  dropdownBackdrop: {
    position: "absolute",
    top: -200,
    left: -20,
    right: -20,
    bottom: 0,
    zIndex: 999,
  },
  dropdownMenu: {
    position: "absolute",
    bottom: 52, // Position above the input field (input height 50 + 2px margin)
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: {width: 0, height: -4}, // Shadow above
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
    marginBottom: 4,
  },
  dropdownOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownOptionActive: {
    backgroundColor: "#eff6ff",
  },
  dropdownOptionText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#6b7280",
  },
  dropdownOptionTextActive: {
    color: "#0ea5e9",
    fontFamily: FontFamily.medium,
  },
  categoryChip: {
    flexGrow: 1,
    flexBasis: "30%",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  categoryChipActive: {
    backgroundColor: "#eff6ff", // Light Blue
    borderColor: "#eff6ff",
  },
  categoryChipText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
    color: "#4b5563",
  },
  categoryChipTextActive: {
    color: "#0ea5e9", // Blue Text
  },
  dropdownInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 20,
  },
  inputText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.regular,
    color: "#6b7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginBottom: 20,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toggleTitle: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#111827",
  },
  toggleSubtitle: {
    fontSize: RFValue(10),
    fontFamily: FontFamily.regular,
    color: "#9ca3af",
  },
  switch: {
    transform: Platform.OS === "ios" ? [{scaleX: 0.8}, {scaleY: 0.8}] : [],
  },

  // --- Footers ---
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  modalFooterSingle: {
    marginTop: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#1f2937",
  },
  applyButton: {
    flex: 2,
    backgroundColor: "#0ea5e9", // Blue
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },
  createButton: {
    width: "100%",
    backgroundColor: "#0ea5e9", // Blue
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: RFValue(12),
    fontFamily: FontFamily.bold,
    color: "#ffffff",
  },

  // --- Create Circle Mode Styles ---
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    justifyContent: "center",
  },
  colorOption: {
    width: (width - 40 - 64) / 8, // 8 items per row, 7 gaps of ~8-9px
    height: 40,
    aspectRatio: 1,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  // --- New Circle Button ---
  newCircleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 16,
  },
  newCircleBtnText: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.bold,
  },

  // --- Circle Picker Styles ---
  circlePickerContainer: {
    gap: 8,
    marginBottom: 8,
  },
  circlePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  circleColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  circlePickerName: {
    flex: 1,
    fontSize: RFValue(12),
    fontFamily: FontFamily.medium,
  },
  circlePickerLoading: {
    fontSize: RFValue(11),
    fontFamily: FontFamily.regular,
    textAlign: "center",
    paddingVertical: 12,
  },
});
