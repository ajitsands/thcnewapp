import {FlatList, StyleSheet, Text, View} from 'react-native';
import colors from '../../../themes/colors';
import {Header} from '../../../core/components/header';
import {HeaderBar} from '../../../core/components/headerBar';
import {FontFamily} from '../../../themes/fonts';
import {useAppDispatch, useAppSelector} from '../../../store';
import {Loader} from '../../../core/components/loader';
import {useEffect, useState} from 'react';
import {ErrorModal} from '../../../core/components/errorModal';
import {scaleFont} from '../../../utils/helper';

export const HistoryScreen = () => {
  const dispatch = useAppDispatch();
  const [showModal, setShowModal] = useState(false);
  const {data, status, loading, error} = useAppSelector(state => state.history);
  const historyData = data?.data;
  useEffect(() => {
    if (error) {
      setShowModal(true);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      <Header />
      <View style={{marginVertical: 20, flex: 1}}>
        <HeaderBar title="HISTORY" />
        <View style={styles.historyList}>
          <View style={styles.header}>
            <Text style={styles.title}>WORK ORDER</Text>
            <Text style={styles.title}>DATE</Text>
            <Text style={styles.title}>STATUS</Text>
          </View>
          {loading ? (
            <Loader />
          ) : (
            <FlatList
              data={historyData}
              renderItem={({item}) => (
                <View style={[styles.header, {backgroundColor: colors.white}]}>
                  <Text style={styles.itemLabel}>{item.ticket_ref_no}</Text>
                  <Text style={styles.itemLabel}>{item.visit_date}</Text>
                  <Text style={[styles.itemLabel, {color: colors.startBlue}]}>
                    {item.ticket_status}
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
      {showModal && (
        <ErrorModal
          errorText={error}
          visible={showModal}
          toggle={() => setShowModal(false)}
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
    marginHorizontal: 10,
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
    borderWidth: 1,
    borderColor: colors.primary,
  },
  title: {
    color: colors.white,
    fontSize: scaleFont(12),
    fontFamily: FontFamily.bold,
    flex: 1,
    textAlign: 'left',
  },
  itemLabel: {
    fontSize: scaleFont(11),
    color: colors.black,
    fontFamily: FontFamily.medium,
    flex: 1,
    textAlign: 'left',
  },
});
