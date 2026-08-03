import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {Header} from '../../../core/components/header';
import {HeaderBar} from '../../../core/components/headerBar';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  getCategoryDetails,
  resetCategoryError,
  resetSelectedCategory,
} from '../../../store/reducers/requisitionReducers/getCategoryReducers';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {BottomModal} from '../components/BottomModal';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import {useToast} from 'react-native-toast-notifications';

import {
  addItemDetails,
  resetAddItemError,
  resetRequisitionSerialNos,
} from '../../../store/reducers/requisitionReducers/addRequisitionItemReducer';
import {ErrorModal} from '../../../core/components/errorModal';
import {
  deleteItemDetails,
  resetDeleteItemError,
  resetDeleteItemStatus,
} from '../../../store/reducers/requisitionReducers/deleteRequisitionItemreducer';
import {
  resetProductError,
  resetProductStatus,
  resetSelectedProductType,
} from '../../../store/reducers/requisitionReducers/getProductType';
import {
  resetItemError,
  resetItemStatus,
} from '../../../store/reducers/requisitionReducers/itemDetailsReducer';
import {scaleFont} from '../../../utils/helper';

export const RequisitionView = () => {
  const dispatch = useAppDispatch();

  const {apiKey, employeeCode} = useAppSelector(state => state.app);
  const [showCategoryModal, setCategoryShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [quantity, setQuantity] = useState<Record<string, string>>({});
  const [errorText, setErrorText] = useState('');

  const {reqisitionData, loading, selectedCategory} =
    useAppSelector(state => state.requisitionCategories);
  const {
    productTypeLoading,
    productTypes,
    productTypesStatus,
    selectedProduct,
  } = useAppSelector(state => state.productType);
  const {itemDetails, itemStatus, itemLoading} = useAppSelector(
    state => state.itemDetails,
  );
  const {
    additemError,
    additemStatus,
    requisitionSerialNos,
  } = useAppSelector(state => state.addRequisitionItemDetails);
  const {deleteitemStatus} = useAppSelector(state => state.deleteRequisition);
  const {ticketType, data} = useAppSelector(state => state.tickets);
  const ticketDetails = data?.data[0];

  const toast = useToast();

  useEffect(() => {
    dispatch(
      getCategoryDetails({
        action: 'get_category_details',
        emp_code: employeeCode,
        APIKEY: apiKey,
      }),
    );
    resetActions();
  }, []);

  useEffect(() => {
    if (additemStatus === 'success' || deleteitemStatus === 'success') {
      setErrorText('REQUISITION UPDATED SUCCESSFULLY');
      setShowErrorModal(true);
    } else if (additemStatus === 'failed' || deleteitemStatus === 'failed') {
      setErrorText(additemError || 'Failed to update requisition');
      setShowErrorModal(true);
    }
  }, [additemStatus, deleteitemStatus]);

  const handleQuantityChange = (text: string, productItemId: string) => {
    setQuantity(prev => ({
      ...prev,
      [productItemId]: text,
    }));
  };

  const resetActions = () => {
    dispatch(resetProductStatus());
    dispatch(resetItemStatus());
    dispatch(resetSelectedCategory());
    dispatch(resetSelectedProductType());
    dispatch(resetRequisitionSerialNos());
    dispatch(resetItemError());
    dispatch(resetProductError());
    dispatch(resetCategoryError());
  };

  const handleDeleteRequisition = (requisitionItem: any) => {
    const itemToDelete = requisitionSerialNos?.find(
      (item: any) => item.productItemId === requisitionItem.product_item_id,
    );
    dispatch(
      deleteItemDetails({
        action: 'delete_item_request',
        APIKEY: apiKey,
        emp_code: employeeCode,
        product_item_id: requisitionItem.product_item_id,
        requisition_serial_no: itemToDelete?.requisition_serial_no,
      }),
    );
  };

  const handleAddRequisitionItem = (requisitionItem: any) => {
    if (!quantity[requisitionItem.product_item_id]) {
      toast.show('Please enter the required quantity', {
        style: styles.toast,
      });
    } else {
      dispatch(
        addItemDetails({
          action: 'get_add_item_request',
          APIKEY: apiKey,
          emp_code: employeeCode,
          product_type_id: selectedProduct.product_type_id,
          product_item_id: requisitionItem.product_item_id,
          product_item_name: requisitionItem.product_item_name,
          product_category_id: selectedCategory?.product_category_id,
          product_category_name: selectedCategory?.product_category_name,
          product_quantity: quantity[requisitionItem.product_item_id],
          product_type_name: selectedProduct.product_type_name,
          amc_ticket: ticketType,
          amc_tkt_ref: ticketDetails?.ticket_ref_code,
          asset_code: ticketDetails?.asset_code,
          building_id: ticketDetails?.building_id,
          building_name: ticketDetails?.building_name,
          customer_id: ticketDetails?.customer_id,
          customer_name: ticketDetails?.customer_name,
          location_name: ticketDetails?.location_name,
          location_id: ticketDetails?.location_id,
          requisition_serial_no:
            requisitionSerialNos?.length === 0
              ? ''
              : requisitionSerialNos[0].requisition_serial_no,
        }),
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header isHome={false} />
      <LoadingOverlay visible={loading || productTypeLoading || itemLoading} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <HeaderBar title="MATERIAL REQUISITION" />

        {/* Category Picker Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.label}>PRODUCT CATEGORY</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.dropdownBtn}
            onPress={() => setCategoryShowModal(true)}>
            <MaterialIcons name="category" size={20} color={colors.primary} style={{marginRight: 8}} />
            <Text style={styles.dropdownText} numberOfLines={1}>
              {selectedCategory
                ? selectedCategory?.product_category_name
                : 'Select Product Category'}
            </Text>
            <MaterialIcons name="arrow-drop-down" color={colors.header} size={24} />
          </TouchableOpacity>
        </View>

        {/* Product Type Picker Card */}
        {productTypesStatus === 'success' && (
          <View style={styles.sectionCard}>
            <Text style={styles.label}>PRODUCT TYPE</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.dropdownBtn}
              onPress={() => setShowProductModal(true)}>
              <MaterialIcons name="inventory" size={20} color={colors.primary} style={{marginRight: 8}} />
              <Text style={styles.dropdownText} numberOfLines={1}>
                {selectedProduct
                  ? selectedProduct?.product_type_name
                  : 'Select Product Type'}
              </Text>
              <MaterialIcons name="arrow-drop-down" color={colors.header} size={24} />
            </TouchableOpacity>
          </View>
        )}

        {/* Available Items List Section */}
        {itemStatus === 'success' && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Select Material Items</Text>
            <Text style={styles.sectionSubtitle}>
              Specify required quantity and tap add to include in requisition
            </Text>

            {itemDetails?.data?.map((item: any, key: number) => {
              const isAdded = requisitionSerialNos.some(
                (requisition: any) =>
                  requisition?.productItemId === item.product_item_id,
              );

              return (
                <View style={styles.itemRowCard} key={key}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item?.product_item_name}
                    </Text>
                    <Text style={styles.itemId}>Code: #{item?.product_item_id}</Text>
                  </View>

                  <TextInput
                    style={styles.qtyInput}
                    value={quantity[item.product_item_id] || ''}
                    placeholder="Qty"
                    placeholderTextColor={colors.grey}
                    keyboardType="numeric"
                    onChangeText={text =>
                      handleQuantityChange(text, item.product_item_id)
                    }
                  />

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.actionBtn,
                      isAdded ? styles.deleteBtn : styles.addBtn,
                    ]}
                    onPress={() =>
                      isAdded
                        ? handleDeleteRequisition(item)
                        : handleAddRequisitionItem(item)
                    }>
                    <MaterialIcons
                      name={isAdded ? 'delete-outline' : 'add-shopping-cart'}
                      color={colors.white}
                      size={18}
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {(showCategoryModal || showProductModal) && (
        <BottomModal
          visible={showCategoryModal || showProductModal}
          toggle={() =>
            showProductModal
              ? setShowProductModal(false)
              : setCategoryShowModal(false)
          }
          content={showProductModal ? productTypes?.data : reqisitionData?.data}
        />
      )}

      {showErrorModal && (
        <ErrorModal
          visible={showErrorModal}
          toggle={() => {
            setShowErrorModal(false);
            dispatch(resetDeleteItemStatus());
            dispatch(resetDeleteItemError());
          }}
          errorText={errorText}
        />
      )}
    </View>
  );
};

export default RequisitionView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  label: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 52,
  },
  dropdownText: {
    flex: 1,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  sectionTitle: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  sectionSubtitle: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginBottom: 14,
  },
  itemRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  itemId: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.medium,
    color: colors.grey,
    marginTop: 2,
  },
  qtyInput: {
    width: 60,
    height: 40,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginHorizontal: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    backgroundColor: colors.primary,
  },
  deleteBtn: {
    backgroundColor: colors.red,
  },
  toast: {
    bottom: 50,
  },
});
