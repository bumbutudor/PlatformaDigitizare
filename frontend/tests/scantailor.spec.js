import React from 'react';
import { expect } from 'chai';
import ScanTailor from '../src/components/ScanTailor';
import { SCANTAILOR_DEFAULT_OPTIONS } from '../src/utils/ScanTailorConfig';

describe('ScanTailor server controls', () => {
  let store;
  let wrapper;
  let changed;
  beforeEach(() => {
    store = { preprocessMode: 'desktop', preprocessScanTailor: {} };
    changed = 0;
    wrapper = enzyme.shallow(<ScanTailor getStore={() => store}
      updateStore={update => { store = { ...store, ...update }; }}
      onOptionsChange={() => { changed += 1; }} />);
  });
  afterEach(() => wrapper.unmount());

  it('selects server mode and exposes separate source and output DPI', () => {
    expect(store.preprocessMode).to.equal('web');
    expect(wrapper.find('[name="inputDpi"]').prop('value')).to.equal(300);
    expect(wrapper.find('[name="resolution"]').prop('value')).to.equal(600);
    expect(store.preprocessScanTailor).to.deep.equal(SCANTAILOR_DEFAULT_OPTIONS);
  });

  it('sends numeric values and checkbox state to the request store', () => {
    wrapper.find('[name="inputDpi"]').simulate('change', { target: { name: 'inputDpi', type: 'number', value: '400' } });
    wrapper.find('[name="whiteMargins"]').simulate('change', { target: { name: 'whiteMargins', type: 'checkbox', checked: false } });
    expect(store.preprocessScanTailor.inputDpi).to.equal('400');
    expect(store.preprocessScanTailor.whiteMargins).to.equal(false);
    expect(changed).to.equal(2);
  });

  it('shows manual angle and restores all settings', () => {
    wrapper.find('[name="deskew"]').simulate('change', { target: { name: 'deskew', type: 'select-one', value: 'manual' } });
    expect(wrapper.find('[name="rotation"]')).to.have.lengthOf(1);
    wrapper.instance().resetOptions();
    expect(store.preprocessScanTailor).to.deep.equal(SCANTAILOR_DEFAULT_OPTIONS);
    expect(wrapper.find('[name="rotation"]')).to.have.lengthOf(0);
  });

  it('disables changes during processing', () => {
    wrapper.setProps({ disabled: true });
    expect(wrapper.find('fieldset').prop('disabled')).to.equal(true);
  });
});
