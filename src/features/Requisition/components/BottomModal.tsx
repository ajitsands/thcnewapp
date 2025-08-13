import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import Modal from 'react-native-modal';
import {scaleFont, screenHeight} from '../../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../../themes/fonts';
import {useAppDispatch, useAppSelector} from '../../../store';
import {
  getProductTypes,
  setSelectedProductType,
} from '../../../store/reducers/requisitionReducers/getProductType';
import {getItemDetails} from '../../../store/reducers/requisitionReducers/itemDetailsReducer';
import {setSelectedCategory} from '../../../store/reducers/requisitionReducers/getCategoryReducers';
import {useEffect, useState} from 'react';

interface ModalProps {
  visible: boolean;
  toggle: () => void;
  content: Array<T>;
}
export const BottomModal = (props: ModalProps) => {
  const {visible, toggle, content} = props;
  const dispatch = useAppDispatch();
  const {employeeCode, apiKey} = useAppSelector(state => state.app);
  const {reqisitionData, status, error, loading, selectedCategory} =
    useAppSelector(state => state.requisitionCategories);
  const {productTypeError} = useAppSelector(state => state.productType);
  console.log('eeeeeee', error, productTypeError);

  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(content);

  useEffect(() => {
    console.log('contennttt', content);
    const filtered = content.filter(
      item =>
        item?.product_type_name
          ?.toLowerCase()
          ?.includes(searchText.toLowerCase()) ||
        item?.product_category_name
          ?.toLowerCase()
          ?.includes(searchText.toLowerCase()),
    );

    setFilteredData(filtered);
  }, [searchText]);

  const renderList = ({item}: any) => {
    return (
      <TouchableOpacity
        style={styles.headingContainer}
        onPress={() => {
          if (item?.product_type_id) {
            dispatch(setSelectedProductType(item));
            dispatch(
              getItemDetails({
                action: 'get_item_details',
                product_type_id: item.product_type_id,
                APIKEY: apiKey,
                emp_code: employeeCode,
              }),
            );
          } else {
            dispatch(setSelectedCategory(item));
            dispatch(
              getProductTypes({
                action: 'get_product_type',
                category_id: item.product_category_id,
                APIKEY: apiKey,
                emp_code: employeeCode,
              }),
            );
          }

          toggle();
        }}>
        <Text style={styles.error}>
          {item.product_type_name || item.product_category_name}
        </Text>
      </TouchableOpacity>
    );
  };
  return (
    <Modal
      isVisible={visible}
      useNativeDriver={true}
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      onBackdropPress={() => toggle()}
      backdropOpacity={0.6}>
      <View style={styles.modalContent}>
        <View style={styles.header}>
          <TextInput
            placeholder="Search Here"
            value={searchText}
            onChangeText={setSearchText}
            style={styles.input}
          />
        </View>
        {productTypeError || error ? (
          <Text style={styles.assetText}>{productTypeError || error}</Text>
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderList}
            keyExtractor={item =>
              item.product_type_id || item.product_category_id
            }
            contentContainerStyle={
              filteredData.length === 0 && styles.flatlistContentCenter
            }
            ListEmptyComponent={() => (
              <Text style={styles.assetText}>No data found</Text>
            )}
          />
        )}
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: -10,
    marginBottom: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    height: screenHeight * 0.35,
    borderRadius: Platform.OS == 'ios' ? 30 : 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },

  infoButton: {
    marginHorizontal: 20,
    backgroundColor: '#33485E',
    borderWidth: 3,
    borderColor: '#959595',
    borderRadius: 12,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoButtonText: {
    color: '#fff',
    fontSize: scaleFont(18),
  },
  assetButton: {
    backgroundColor: colors.yellow,
    borderWidth: 3,
    borderColor: '#959595',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    // paddingHorizontal: 20,
    color: colors.primary,
    fontSize: scaleFont(18),
    padding: 5,
    // marginHorizontal:20,
    margin: 10,
    fontFamily: FontFamily.deupRegular,
    textAlign: 'center',
  },
  cancel: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetText: {
    color: colors.black,
    fontFamily: FontFamily.medium,
    fontSize: scaleFont(16),
    textAlign: 'center',
  },
  header: {
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    borderWidth: 1,
    margin: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    borderColor: colors.lightBlack,
  },
  headingContainer: {
    margin: 20,
  },
  icon: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blue,
    height: 40,
    width: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: scaleFont(16),
    color: colors.black,
    marginLeft: 5,
  },
  input: {
    fontSize: scaleFont(16),
    fontFamily: FontFamily.medium,
  },
  flatlistContentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
