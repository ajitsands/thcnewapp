import React, {useState} from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import colors from '../../../themes/colors';
import Modal from 'react-native-modal';
import {scaleFont} from '../../../utils/helper';
import MaterialIcons from '@react-native-vector-icons/material-icons';
import {FontFamily} from '../../../themes/fonts';
import {ImageView} from '../../../core/components/imageView';

interface ModalProps {
  visible: boolean;
  toggle: () => void;
  details: any;
}

export const CustomerModal = (props: ModalProps) => {
  const {visible, toggle, details} = props;
  const [showImageView, setShowImageView] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const customerFields = [
    {
      title: 'Customer Name',
      value: details?.customer_name || 'N/A',
      icon: 'person',
    },
    {
      title: 'Location',
      value: details?.location_name || 'N/A',
      icon: 'place',
    },
    {
      title: 'Building',
      value: details?.building_name || 'N/A',
      icon: 'domain',
    },
    {
      title: 'Contact Number',
      value: details?.customer_contact_no || 'N/A',
      icon: 'phone',
    },
    {
      title: 'Complaint Description',
      value: details?.complaints_description || 'No description provided',
      icon: 'description',
    },
  ];

  return (
    <>
      <Modal
        isVisible={visible}
        useNativeDriver={true}
        style={styles.modal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        onBackdropPress={toggle}
        backdropOpacity={0.6}>
        <View style={styles.modalContent}>
          {/* Top Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleContainer}>
              <View style={styles.infoBadge}>
                <MaterialIcons name="info" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>Customer & Work Order Details</Text>
                <Text style={styles.headerSubtitle}>
                  Work Order #{details?.ticket_ref_code || '---'}
                </Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} style={styles.closeBtn} onPress={toggle}>
              <MaterialIcons name="close" size={20} color={colors.grey} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.infoScrollView} showsVerticalScrollIndicator={false}>
            {/* Info Fields Grid */}
            <View style={styles.fieldsContainer}>
              {customerFields.map((item, index) => (
                <View key={index} style={styles.fieldTile}>
                  <MaterialIcons name={item.icon} size={18} color={colors.primary} style={styles.fieldIcon} />
                  <View style={styles.fieldContent}>
                    <Text style={styles.fieldLabel}>{item.title}</Text>
                    <Text style={styles.fieldValue}>{item.value}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Ticket Images Section */}
            {(details?.ticket_image || details?.second_ticket_image) && (
              <View style={styles.imagesSection}>
                <Text style={styles.imagesSectionTitle}>Attached Photos</Text>
                <View style={styles.imagesRow}>
                  {details?.ticket_image ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.imageWrapper}
                      onPress={() => {
                        setShowImageView(true);
                        setImageUrl(details?.ticket_image);
                      }}>
                      <Image source={{uri: details?.ticket_image}} style={styles.thumbnailImage} />
                      <View style={styles.zoomOverlay}>
                        <MaterialIcons name="zoom-in" size={16} color={colors.white} />
                      </View>
                    </TouchableOpacity>
                  ) : null}

                  {details?.second_ticket_image ? (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.imageWrapper}
                      onPress={() => {
                        setShowImageView(true);
                        setImageUrl(details?.second_ticket_image);
                      }}>
                      <Image source={{uri: details?.second_ticket_image}} style={styles.thumbnailImage} />
                      <View style={styles.zoomOverlay}>
                        <MaterialIcons name="zoom-in" size={16} color={colors.white} />
                      </View>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Close Button */}
          <TouchableOpacity activeOpacity={0.85} style={styles.gotItBtn} onPress={toggle}>
            <Text style={styles.gotItBtnText}>GOT IT</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {showImageView && (
        <ImageView
          visible={showImageView}
          toggle={() => setShowImageView(false)}
          imageUrl={imageUrl}
        />
      )}
    </>
  );
};

export default CustomerModal;

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '82%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: scaleFont(14),
    fontFamily: FontFamily.bold,
    color: colors.header,
  },
  headerSubtitle: {
    fontSize: scaleFont(11),
    fontFamily: FontFamily.regular,
    color: colors.grey,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoScrollView: {
    marginBottom: 14,
  },
  fieldsContainer: {
    gap: 10,
  },
  fieldTile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: scaleFont(10),
    fontFamily: FontFamily.bold,
    color: colors.grey,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    color: colors.header,
    lineHeight: 18,
  },
  imagesSection: {
    marginTop: 14,
  },
  imagesSectionTitle: {
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    color: colors.header,
    marginBottom: 8,
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  thumbnailImage: {
    width: 80,
    height: 70,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(11, 44, 81, 0.7)',
    borderRadius: 10,
    padding: 2,
  },
  gotItBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gotItBtnText: {
    color: colors.white,
    fontSize: scaleFont(13),
    fontFamily: FontFamily.bold,
    letterSpacing: 0.5,
  },
});
