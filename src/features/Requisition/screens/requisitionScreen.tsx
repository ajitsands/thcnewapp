import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import colors from '../../../themes/colors';
import {FontFamily} from '../../../themes/fonts';
import {Header} from '../../../core/components/header';
import {useEffect, useState} from 'react';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  getCategoryDetails,
  resetCategoryError,
  resetSelectedCategory,
} from '../../../store/reducers/requisitionReducers/getCategoryReducers';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {BottomModal} from '../components/BottomModal';
import LoadingOverlay from '../../../core/components/loadingOverlay';
import {TextInput} from 'react-native-gesture-handler';
import {useToast} from 'react-native-toast-notifications';

import {
  addItemDetails,
  resetAddItemStatus,
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
  const [quantity, setQuantity] = useState({});
  const [errorText, setErrorText] = useState('');

  const {reqisitionData, status, error, loading, selectedCategory} =
    useAppSelector(state => state.requisitionCategories);
  const {
    productTypeError,
    productTypeLoading,
    productTypes,
    productTypesStatus,
    selectedProduct,
  } = useAppSelector(state => state.productType);
  const {itemDetails, itemError, itemStatus, itemLoading} = useAppSelector(
    state => state.itemDetails,
  );
  const {
    additemDetails,
    additemError,
    additemStatus,
    additemLoading,
    requisitionSerialNos,
  } = useAppSelector(state => state.addRequisitionItemDetails);
  const {deleteitemStatus} = useAppSelector(state => state.deleteRequisition);
  const {ticketType, data} = useAppSelector(state => state.tickets);
  const ticketDetails = data?.data[0];
  console.log(selectedCategory, selectedProduct);
  // console.log('mmmmmmmmmmmmmmmmm', requisitionSerialNos);
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
    if (additemStatus == 'success' || deleteitemStatus == 'success') {
      setErrorText('UPDATED SUCCESSFULLY');
      setShowErrorModal(true);
    } else if (additemStatus == 'failed' || deleteitemStatus == 'failed') {
      setErrorText(additemError);
      setShowErrorModal(true);
    }
  }, [additemStatus, deleteitemStatus]);

  const handleQuantityChange = (text, productItemId) => {
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

  const handleDeleteRequisition = requisitionItem => {
    const itemToDelete = requisitionSerialNos?.find(
      item => item.productItemId === requisitionItem.product_item_id,
    );
    console.log('deleteeeeeeeee', itemToDelete);
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

  const handleAddRequisitionItem = requisitionItem => {
    if (!quantity[requisitionItem.product_item_id]) {
      toast.show('Please enter the quantity', {
        textStyle: {fontSize: scaleFont(16)},
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
            requisitionSerialNos?.length == 0
              ? ''
              : requisitionSerialNos[0].requisition_serial_no,
        }),
      );
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={loading} />
      <Header />
      <View style={styles.historyList}>
        <View style={styles.header}>
          <MaterialIcons name="menu-open" color={colors.white} size={25} />
          <Text style={styles.headerText}>MATERIAL REQUISITION</Text>
        </View>
        <View
          style={{
            backgroundColor: colors.primary,
            borderBottomRightRadius: 20,
            // flex:1
          }}>
          <Text style={styles.title}>PRODUCT CATEGORY TYPE</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCategoryShowModal(true)}>
            <Text style={styles.itemLabel}>
              {selectedCategory
                ? selectedCategory?.product_category_name
                : 'Select a Category'}
            </Text>
            <MaterialIcons
              name="arrow-drop-down"
              color={colors.primary}
              size={25}
            />
          </TouchableOpacity>
          <LoadingOverlay visible={productTypeLoading} />
          {productTypesStatus == 'success' && (
            <View style={{marginVertical: 8}}>
              <Text style={styles.title}>PRODUCT TYPE</Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowProductModal(true)}>
                <Text style={styles.itemLabel}>
                  {selectedProduct
                    ? selectedProduct?.product_type_name
                    : 'Select a Product Type'}
                </Text>
                <MaterialIcons
                  name="arrow-drop-down"
                  color={colors.primary}
                  size={25}
                />
              </TouchableOpacity>
            </View>
          )}
          <LoadingOverlay visible={itemLoading} />
          {itemStatus == 'success' &&
            itemDetails?.data?.map((item, key) => {
              const isCompleted = requisitionSerialNos.some(
                requisition =>
                  requisition?.productItemId === item.product_item_id,
              );

              return (
                <View style={{marginVertical: 3}} key={key}>
                  <TouchableOpacity
                    style={styles.button}
                    // onPress={() => setShowItemModal(true)}
                  >
                    <Text
                      style={[
                        styles.itemLabel,
                        {
                          fontFamily: FontFamily.deupRegular,
                          fontSize: scaleFont(18),
                        },
                      ]}>{`${item?.product_item_id} - ${item?.product_item_name}`}</Text>
                    <TextInput
                      style={styles.inputContainer}
                      value={quantity[item.product_item_id] || ''}
                      placeholder="0"
                      onChangeText={text =>
                        handleQuantityChange(text, item.product_item_id)
                      }
                    />
                    <TouchableOpacity
                      style={[
                        styles.playButton,
                        {
                          backgroundColor: isCompleted
                            ? colors.blue
                            : colors.green,
                        },
                      ]}
                      onPress={() =>
                        isCompleted
                          ? handleDeleteRequisition(item)
                          : handleAddRequisitionItem(item)
                      }>
                      <MaterialIcons
                        name={isCompleted ? 'refresh' : 'play-circle-outline'}
                        color={colors.white}
                        size={25}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              );
            })}
        </View>
      </View>
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
            dispatch(resetAddItemStatus());
            dispatch(resetDeleteItemStatus());
            dispatch(resetAddItemError());
            dispatch(resetDeleteItemError());
          }}
          errorText={errorText}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  historyList: {
    margin: 10,
    flex: 1,
    backgroundColor: colors.primary,
    borderBottomRightRadius: 10,
    marginBottom: 50,
  },
  header: {
    backgroundColor: colors.red,
    height: 50,
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: colors.white,
    fontFamily: FontFamily.duepBold,
    fontSize: scaleFont(18),
    marginLeft: 10,
  },
  title: {
    color: colors.white,
    fontSize: scaleFont(16),
    fontFamily: FontFamily.variation,
    // flex: 1,
    textAlign: 'left',
    margin: 10,
  },
  itemLabel: {
    fontSize: scaleFont(16),
    color: colors.black,
    fontFamily: FontFamily.medium,
    flex: 1,
    textAlign: 'left',
  },
  button: {
    backgroundColor: colors.white,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.black,
    marginHorizontal: 10,
    paddingHorizontal: 5,
  },
  playButton: {
    backgroundColor: colors.green,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 6,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    padding: 8,
    width: 100,
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 5,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    fontSize: scaleFont(16),
  },
});
