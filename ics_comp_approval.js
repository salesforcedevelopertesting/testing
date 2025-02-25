/**
***************************************************************************************
* @Name of the LWC  	: Ics_comp_approval.js
* @Description       	: Container Component to display the new client officer layout SBO-UK
* @Author            	: Ramya Gurram
* @Created Date      	: 10-11-2023
***************************************************************************************
* @Last Modified By 		: Tushar Walse
* @Last Modified On 		: 09-02-2025
* @Modification description : Modified for SFP-34698 Application Approval flow, Queues and Sign off
*/

import { LightningElement, track, api } from 'lwc';
import selectedAccount from '@salesforce/apex/ICS_CTRL_OnboardingFormCreator.selectedAccount';
import fetchCountryCode from '@salesforce/apex/ICS_CTRL_OnboardingFormCreator.fetchCountryCode';
import getFieldsWithoutAppId from '@salesforce/apex/ICS_CTRL_PreAppFormCreator.fetchScreenFields';
import fetchCurrentApplictaionIdWithProduct from '@salesforce/apex/ICS_CTRL_OnboardingFormCreator.fetchCurrentApplictaionIdWithProduct';
import getThePartyProfileId from '@salesforce/apex/ICS_CTRL_DocumentUpload.getThePartyProfileId';
import submitApplicationForm from '@salesforce/apex/ICS_CTRL_OnboardingFormCreator.submitApplicationForm';
import loadData from '@salesforce/apex/ICS_CTRL_ACPicklist.loadData';
import { NavigationMixin } from "lightning/navigation";
import { FlowNavigationNextEvent, FlowAttributeChangeEvent } from 'lightning/flowSupport';
import ICS_ThemeOverrides from '@salesforce/resourceUrl/ICS_ThemeOverrides';
import getLandingPageJSON from '@salesforce/apex/ICS_CTRL_PreAppFormCreator.getLandingPageJSON';
import fetchProdutDetails from '@salesforce/apex/ICS_CTRL_PreAppFormCreator.fetchProdutDetails';
import fetchDynamicData from '@salesforce/apex/ICS_CTRL_OnboardingFormCreator.fetchDynamicData';
import updateSectionName from '@salesforce/apex/ICS_CTRL_OnboardingFormCreator.updateSectionName';
import fetchQuetsionReposneData from '@salesforce/apex/ICS_CTRL_FecthOnboardingDetails.fetchQuetsionReposneDataWithAccountId';
import getSectionName from '@salesforce/apex/ICS_CTRL_OnboardingFormCreator.getSectionName';
import countryScript from '@salesforce/resourceUrl/ICS_Country_Script';
import { createLogger } from 'sbgplatform/rflibLogger';
const logger = createLogger('LogEventMonitor');

import getDetails from '@salesforce/apex/ICS_CTRL_ApprovalFlow.getDetails';
import saveAssessmentData from '@salesforce/apex/ICS_CTRL_ApprovalFlow.saveAssessmentData';
import getRequiredApprovalProcessesValue from '@salesforce/apex/ICS_CTRL_ApprovalFlow.getRequiredApprovalProcessesValue';
import loadAssessmentData from '@salesforce/apex/ICS_CTRL_ApprovalFlow.loadAssessmentData';

export default class Ics_comp_approval extends NavigationMixin(LightningElement) {
    isJointAccount = true;
    isPrimaryAccountHolder = true;
    preapp = false;
    infoIMG = ICS_ThemeOverrides + '/assets/images/info_icon.svg';
    addicon = ICS_ThemeOverrides + '/assets/images/addicon.svg';
    deleteicon = ICS_ThemeOverrides + '/assets/images/Vector.svg';
    secondaryButton = ICS_ThemeOverrides + '/assets/images/delete.svg';
    plusIcon = ICS_ThemeOverrides + '/assets/images/icn-plus.svg';
    minusIcon = ICS_ThemeOverrides + '/assets/images/icn-minus.svg';
    constants = { NEXT: 'NEXT', BACK: 'BACK' };
    label = {};
    @api adobeDataScope;
    @api adobePageName;
    @api applicationId;
    @api screenName;
    @api availableActions = [];
    @api active;
    @api previousJSON;
    @api productCategory;
    @api keyContactEmail;
    @api previousScreen;
    @api nextScreen;
    @api keyContactMobile;
    isIFA;
    @api flowApplicationId;
    @api productCode;
    @track isAddAddressModal = false;
    @track accId;
    @track sections;
    @track formDetails = {};
    @track activeTab = '0';
    @track count = 0;
    sectionsDup;
    screenTitle;
    screenSubtitle;
    isLoaded;
    isAtScreenLoad;
    isSaveAndExit;
    formDetailsToChild = {};
    errorMessage;
    countryOfResidence;
    buttonText = 'Next';
    productSchemaName;
    filterProvinceValues;
    filterProvienceValueCR;
    filterSubRegionValues;
    filterSubRegionValueCr;
    isdynamicCss = true;
    calculatedMonths;
    calculatedYears;
    previousResiAddDetails;
    skipPreviousEmploymentDetails = false;
    employmentStatus;
    isAddAddressModalTitle;
    addId;
    accordianSection = false;
    accordianSectionsData;
    isDualEmployment;
    selectedValueList;
    renderAccordian;
    IdAccordian;
    formDetailsEdit = {};
    phoneNumberErrorMessage;
    pleaseSelectUniqueValues;
    pleaseSelectMinPreviousAddress;
    allcountries;
    acisAlreadyLoadedcountResult;
    accountResultObj;
    isFieldsLoaded = true;
    isPicklistLoaded;
    countryCodeData;
    isJointTab;
    isAlreadyLoaded;
    actualData;
    isRadioLoad = true;
    hideDocumentUpload;
    @track ProvinceName;
    @api BackButton;
    @api recordId;

    @api groupedDetails;
    @api relation;
    renderFlow = false;
    /**
     * @description Method for connected callback
     */
        inputVariables = [
            {
                name: 'recordId',
                type: 'String',
                value: ''
            }];

    handleGetLandingPageData() {
        this.isLoaded = true;
        getLandingPageJSON({
            developerName: 'ApplicationForm'
        })
            .then(result => {
                this.label = JSON.parse(result.Description__c);
                this.fetchAppId();
            })
            .catch(error => {
                this.isLoaded = false;
                logger.debug('handleGetLandingPageData: ' + error);
            });
    }

    handleActive(event) {
        this.activeTab = event.target.dataTabValue;
        this.loadNextTab();
    }

    renderedCallback() {
        this.loadrenderedValues();
        this.template.querySelectorAll('[type="radio"]').forEach(
            (input) => {
                this.initializeRadio(input.dataset.name, 1);
            }
        );
    }

    initializeRadio(name, indexOfOption) {
        let elements = this.template.querySelectorAll('[data-name="' + name + '"]');
        let allRadiosUnchecked = true;
        elements.forEach(
            (input) => {
                allRadiosUnchecked = allRadiosUnchecked && !input.checked;
            }
        );
        if (allRadiosUnchecked && indexOfOption < elements.length) {
            elements[indexOfOption].click();
        }
    }

    handleStatusChange(event) {
        if (event.detail.status === 'STARTED') {
            this.isLoaded = true;
        } else if (event.detail.status === 'FINISHED') {
            this.isLoaded = false;
        }
    }

    loadrenderedValues() {
        if (this.formDetails && !this.isAlreadyLoaded && Object.entries(this.formDetails)?.length != 0 && this.isRadioLoad == true) {
            this.processRadioInputs();
        }
        if (this.formDetails && !this.isAlreadyLoaded && Object.entries(this.formDetails)?.length != 0) {
            let isRendered = this.checkFieldsRendered();
            if (isRendered) {
                this.isAlreadyLoaded = true;
            }
        }
        if (this.isFieldsLoaded && this.formDetails['Contact Number']) {
            this.checkCountryCode();
        }
        if (this.IdAccordian && this.renderAccordian) {
            this.adjustAccordianButtons();
        }
        if (!this.isPicklistLoaded && Object.keys(this.formDetails)?.length > 0) {
            this.loadPicklistValues();
        }
    }

    processRadioInputs() {
        this.template.querySelectorAll('[type="radio"]').forEach(element => {
            this.sections.forEach(section => {
                section.fields.forEach((field, index) => {
                    this.processRadioInput(element, field);
                });
            });
        });
    }

    processRadioInput(element, field) {
        if (element.dataset.name == field.name) {
            this.checkFormDetails(element, field);
        }
    }

    checkFormDetails(element, field) {
        if (this.formDetails[element.dataset.name]) {
            if (element.dataset.value == this.formDetails[element.dataset.name]) {
                element.checked = true;
            }
        } else if (field.defaultValue && element.dataset.value == field.defaultValue) {
            element.checked = true;
            this.formDetails[field.name] = field.defaultValue;
        } else {
            this.setDefaultFromOptions(element, field);
        }
    }

    setDefaultFromOptions(element, field) {
        const defaultOption = field.options.find(option => option.isDefault);
        if (defaultOption && element.dataset.value == defaultOption.value) {
            element.checked = true;
            this.formDetails[field.name] = defaultOption.value;
        }
    }

    checkFieldsRendered() {
        let isRendered = false;
        for (let j in this.sections) {
            if (Number(this.activeTab) === Number(j)) {
                let count = 0;
                let fieldFilter = this.sections[j].fields.filter(field => (field.isInput ||
                    field.isInputreadonly ||
                    field.isDate ||
                    field.isMultiselect ||
                    field.isMultiselectReadonly ||
                    field.ispicklistWithInput ||
                    field.isCheckbox) && !field.isHidden);
                for (let field of this.sections[j].fields) {
                    count += this.updateFieldValues(field);
                }
                if (fieldFilter.length === count) {
                    isRendered = true;
                    break;
                }
            }
        }
        return isRendered;
    }

    /**
     * @description Method to update field values
     */
    updateFieldValues(field) {
        let count = 0;
        count += this.updateInputFieldsCheckRendered(field);
        count += this.updateMultiSelectFieldsCheckRendered(field);
        count += this.updatePicklistWithInputFieldsCheckRendered(field);
        count += this.updateCurrencyFieldsCheckRendered(field);
        return count;
    }
    /**
     * @description Method to updateInputFieldsCheckRendered
     */
    updateInputFieldsCheckRendered(field) {
        let count = 0;
        this.template.querySelectorAll('input').forEach(input => {
            if (field.name === input.name) {
                count++;
                if (this.formDetails[field.name]) {
                    input.value = this.formDetails[field.name];
                }
            }
        });
        return count;
    }
    /**
     * @description Method to updateMultiSelectFieldsCheckRendered
     */
    updateMultiSelectFieldsCheckRendered(field) {
        let count = 0;
        if (field.isMultiselect || field.isMultiselectReadonly) {
            this.template.querySelectorAll('c-ics_comp_multi-picklist').forEach(picklist => {
                if (field.name === picklist.dataset.name) {
                    picklist.valuesDefault = this.formDetails[picklist.dataset.name];
                    picklist.triggerValues();
                    count++;
                }
            });
        }
        return count;
    }
    /**
     * @description Method to updatePicklistWithInputFieldsCheckRendered
     */
    updatePicklistWithInputFieldsCheckRendered(field) {
        let count = 0;
        if (field.ispicklistWithInput) {
            this.template.querySelectorAll('c-ics_comp_inputwith-flag-icon').forEach(inputWithFlag => {
                if (field.name === inputWithFlag.name) {
                    inputWithFlag.defaultValue = this.formDetails[inputWithFlag.name];
                    if (inputWithFlag.name === 'Contact Number') {
                        inputWithFlag.selectedCountry = this.formDetails['FlagCode'];
                    } else if (inputWithFlag.name === 'Alternative Contact Number') {
                        inputWithFlag.selectedCountry = this.formDetails['FlagCodeAlternative'];
                    }
                    inputWithFlag.triggerValues();
                    count++;
                }
            });
        }
        return count;
    }
    /**
     * @description Method to updateCurrencyFieldsCheckRendered
     */
    updateCurrencyFieldsCheckRendered(field) {
        let count = 0;
        if (field.isCurrency) {
            this.template.querySelectorAll('c-ics_comp_currencyinput').forEach(currencyinput => {
                if (field.name === currencyinput.dataset.name) {
                    let currencyName = currencyinput.dataset.name + 'Currency';
                    currencyinput.selectedCurrencyValue = this.formDetails[currencyName];
                    currencyinput.value = this.formDetails[currencyName]?.split(':')[1];
                    currencyinput.updatedTriggerValue();
                    count++;
                }
            });
        }
        return count;
    }

    checkCountryCode() {
        const contactDetailsSection = this.sections.find(section => section.title === 'Contact Details');
        const contactDetailsSectionIndex = this.sections.findIndex(section => section.title === 'Contact Details');
        if (!contactDetailsSection) return;
        const countryCodeField = contactDetailsSection.fields.find(field => field.name === 'We note your dialing code is not connected to your country of residence');
        const countryCodeFieldIndex = contactDetailsSection.fields.findIndex(field => field.name === 'We note your dialing code is not connected to your country of residence');
        const countryCodeFieldTextIndex = contactDetailsSection.fields.findIndex(field => field.name === 'We note your dialing code is not connected to your country');
        if (!countryCodeField) return;
        fetchCountryCode({
            'accId': this.accId
        })
            .then(result => {
                const countryCode = this.getCountryCodeFromResult(result);
                this.updateFieldVisibilityBasedOnCountryCode(countryCode, contactDetailsSection, countryCodeField,
                    contactDetailsSectionIndex, countryCodeFieldIndex, countryCodeFieldTextIndex);
            })
            .catch(error => {
                logger.debug('fetchCountryCode:' + error);
            });
    }

    getCountryCodeFromResult(result) {
        let countryCode;
        this.allcountries.forEach(code => {
            if (code.code == result) {
                countryCode = code.phone;
            }
        });
        return countryCode;
    }

    updateFieldVisibilityBasedOnCountryCode(countryCode, section, field, index, fieldIndex, countryCodeFieldTextIndex) {
        const splitContactNumber = this.formDetails['Contact Number']?.split(' ');
        if (!splitContactNumber?.[0]?.includes(countryCode)) {
            this.sections[index].fields[fieldIndex].isHidden = false;
            this.sections[index].fields[fieldIndex].isHiddenTemplate = true;
            this.sections[index].fields[countryCodeFieldTextIndex].isHidden = false;
            this.sections[index].fields[countryCodeFieldTextIndex].isHiddenTemplate = true;
        }
        this.isFieldsLoaded = false;
    }

    adjustAccordianButtons() {
        const elements = this.template.querySelectorAll(".addAnother, .deleteParent, .primaryApplicantProperties");
        elements.forEach(element => {
            if (this.IdAccordian == element.dataset.id) {
                if (element.classList.contains('parentAddAnotherBtn')) {
                    element.classList.remove('parentAddAnotherBtn');
                }
                if (element.classList.contains('primaryApplicantProperties')) {
                    element.style.display = "none";
                    this.renderAccordian = false;
                }
            }
        });
    }

    loadPicklistValues() {
        this.template.querySelectorAll('c-ics_comp_acpicklist').forEach((ele, idx, array) => {
            ele.value = this.formDetails[ele.dataset.name];
            ele.setExistingDataOnDefault();
        })
    }

    selectedData(event) {
        this.previousResiAddDetails = event.detail;
    }

    receivedYears(event) {
        this.calculatedYears = event.detail;
        this.loadExisitngData(this.sections[Number(this.activeTab)].title);
    }

    handleModalOpen(event) {
        this.addId = event.currentTarget.dataset.id;
        this.isAddAddressModal = true;
        this.isAddAddressModalTitle = event.currentTarget.dataset.label;
    }

    readCountriesData() {
        let request = new XMLHttpRequest();
        request.open("GET", countryScript + '/' + 'allcountries' + '.json', false);
        request.send(null);
        let jsonCards = JSON.parse(request.responseText);
        this.allcountries = jsonCards.countriesData;
    }

    connectedCallback() {

        this.screenName = 'ICS UK Full Onboarding Component';

        this.handleGetLandingPageData();
    }

    fetchProductSchemaCode(code) {
        fetchProdutDetails({
            produtCode: code
        }).then(res => {
            this.productSchemaName = res;
        }).catch(error => {
            logger.debug('fetchProdutDetails: ' + error);
        });
    }

    fetchAppId() {
        fetchCurrentApplictaionIdWithProduct().then(async res => {
            let result = JSON.parse(res);
            this.accId = result.accountId;
            this.productschemecode = result.productCode;
            await getSectionName({ 'parentId': this.accId }).then(res => {
                this.existingScreenName = res;
                if (this.existingScreenName) {
                    let activeTabValue = this.existingScreenName?.split(';')?.[1];
                    this.activeTab = this.label[activeTabValue];
                }
            }).catch(error => {
                this.isLoaded = false;
                logger.error('Error getSectionName:', error)
            })
            if (this.productschemecode) {
                await this.fetchProductSchemaCode(this.productschemecode);
            }
            await this.isCheckAssessement();
            this.getFieldsWithoutAppApplication();
            this.readCountriesData();
        }).catch(error => {
            logger.debug('fetchCurrentApplictaionIdWithProduct: ' + error);
        })
    }

    isCheckAssessement() {
        if (this.screenName == 'ICS UK Employment Details') {
            this.fetchQuetsionReposneDataMethod('Current Employment Details',
                'Please confirm if this is your only employment', 'FALSE', 'isDualEmployment');
        } else if (this.screenName == 'ICS UK Financial Details') {
            this.fetchQuetsionReposneDataMethod('Bank Details',
                'Do you have any additional bank accounts other than the main one provided?', 'TRUE', 'isAdditionalBankAcc');
        }
    }

    fetchQuetsionReposneDataMethod(sectionName, question, value, name) {
        fetchQuetsionReposneData({ 'parentId': this.accId, 'sectionName': sectionName }).then(res => {
            res.forEach(f => {
                if (f.AssessmentQuestion.Name == question) { if (f.ResponseValue == value) { this[name] = true } }
            })
        }).catch(error => {
            logger.debug('fetchCurrentApplictaionIdWithProduct: ' + error);
        })
    }

    genericComponentChange(event) {
        const value = event.detail.value;
        const name = event.detail.target;
        this.formDetails[name] = value;
        this.formDetailsEdit[name] = value;
        this.showHiddenDependentFields(event, value);
        this.removeFieldErrors(name);
    }

    selectedIndustryData(name, values, value) {
        let findValue = values.filter(f => f.AOB_Code__c == value);
        if (findValue.length > 0) {
            this.formDetails[name] = findValue[0].Name;
            this.formDetailsEdit[name] = findValue[0].Name;
        }
    }

    handlesubAccordian(event) {
        let id = event.target.dataset.id;
        let activeTabFields = this.sections[this.activeTab].fields;
        activeTabFields.forEach(field => {
            if (field.parent === id) {
                field.isHidden = false;
                field.isHiddenTemplate = true;
                this.template.querySelectorAll('c-ics_comp_parent-accordian').forEach(f => {
                    if (f.dataset.id == field.id) {
                        f.screenName = this.screenName;
                        f.sections = this.sections;
                        f.accId = f.dataset.acc;
                        f.sectionName = f.dataset.tab;
                        f.addApplicant();
                    }
                });
            }
        });
    }

    showHiddenDependentFields(event, valueD) {
        const name = event.target.dataset.name;
        const value = valueD;
        if (name === 'I confirm to that I have fully disclosed all details surrounding my wealth and' && value === 'FALSE') {
            this.formDetails[name] = null;
        } else {
            this.formDetails[name] = value;
        }
        const id = event.target.dataset.id;
        this.sections.forEach((section, index) => {
            if (Number(this.activeTab) === index) {
                this.processFields(section.fields, id, value, name);
            }
        });
    }

    processFields(fields, id, value, name) {
        for (const field of fields) {
            if (field.parent === id) {
                this.updateFieldsProcessVisibility(field, value, name);
            }
        }
    }

    updateFieldsProcessVisibility(field, value, name) {
        if (value && field.parentControllingValue?.toLowerCase().includes(value?.toLowerCase())) {
            if (name == 'Employment Status') {
                field.isHidden = true;
                field.isHiddenTemplate = false;
                field.defaultValue = null;
                this.formDetails[field.name] = null;
                this.isRadioLoad = false;
                if (field.isRadio) {
                    this.template.querySelectorAll('[type="radio"]').forEach(element => {
                        if (element.dataset.name == field.name) {
                            element.checked = null;
                        }
                    });
                } this.fieldsUpgrade(field);
            }
            field.showError = false;
            field.isHidden = false;
            field.isHiddenTemplate = true;
        } else {
            field.isHidden = true;
            field.isHiddenTemplate = false;
            this.hideDependentParentFields(field);
        }
    }

    hideDependentParentFields(parentField) {
        for (const section of this.sections) {
            for (const field of section.fields) {
                if (field.parent === parentField.id) {
                    field.isHidden = true;
                    field.isHiddenTemplate = false;
                }
            }
        }
    }

    genericFieldChangeBlur(event) {
        let name = event.target.dataset.name;
        this.removeFieldErrors(name);
        this.checkFieldOnTabOff(name);
    }

    genericFieldChangeDate(event) {
        event.preventDefault();
        let value = event.target.value;
        let name = event.target.name;
        this.formDetails[name] = value;
        this.formDetailsEdit[name] = value;
        this.removeFieldErrors(name);
    }

    genericFieldChangeCheck(event) {
        let value = event.target.checked;
        let name = event.target.name;
        let param = (value ? 'TRUE' : 'FALSE');

        this.formDetails[name] = value;
        this.formDetailsEdit[name] = value;

        this.showHiddenDependentFields(event, param);
        this.removeFieldErrors(name);
    }

    fieldsUpgrade(field) {
        this.template.querySelectorAll('input').forEach(f => {
            if (field?.name == f.dataset.name) {
                f.value = '';
                this.formDetails[f.name] = '';
            } else if (!field) {
                if (f.name != 'I don\'t have a bank account') {
                    f.value = '';
                    this.formDetails[f.name] = '';
                }
            }
        })
        this.template.querySelectorAll('c-ics_comp_currencyinput').forEach(currencyinput => {
            if (!field || field?.name == currencyinput.dataset.name) {
                this.setCurrentlistValue(currencyinput);
            }
        });
        this.template.querySelectorAll('c-ics_comp_acpicklist').forEach(f => {
            if (!field || field?.name == f.dataset.name) {
                this.setPicklistValue(f);
            }
        });
    }

    setPicklistValue(f) {
        f.value = '';
        f.valueDefault = null;
        f.setExistingDataOnDefault();
        this.formDetails[f.dataset.name] = '';
    }

    setCurrentlistValue(currencyinput) {
        this.formDetails[currencyinput.dataset.name] = '';
        currencyinput.value = null;
        currencyinput.updatedTriggerValue();
    }

    genericComponentChangeBlur(event) {
        let name = event.detail.target;
        let value = event.detail.value;
        if (name != 'IndustryF' && name != 'Industry') {
            this.showHiddenDependentFields(event, value);
        }
        if (name != 'IndustryF' && name != 'Industry') {
            this.formDetails[name] = value;
            this.formDetailsEdit[name] = value;
        }
        this.handleCountryOrProvinceChange(name, value);
        this.handleProvinceChange(name, value);
        this.removeFieldErrors(name);
        this.checkFieldOnTabOff(name);
        this.isGetBankAccounts(name, value);
    }

    isGetBankAccounts(name, value) {
        if (name == 'Select the account the deposit will be coming from') {
            this.formDetails['Party_Assets_Funds__c'] = value;
            this.formDetailsEdit['Party_Assets_Funds__c'] = value;
        }
    }

    async handleCountryOrProvinceChange(name, value) {
        if (name == 'Country of Residence' || name == 'Country') {
            this.filterProvinceValues = true;
            this.filterProvienceValueCR = value;
            if (value != '' && value) {
                this.formDetails['Province'] = '';
                this.formDetails['Sub Region'] = '';
                await this.loadDataProvince('ICS_Province', value);
            }
            this.template.querySelectorAll('c-ics_comp_acpicklist').forEach(ele => {
                if (ele.name === 'Province') {
                    ele.filterProvinceValues = true;
                    ele.filterProvienceValueCr = value;
                    ele.triggerValuesProvince();
                }
            })
        }
    }

    handleProvinceChange(name, value) {
        if (name == 'Province' && value) {
            this.formDetails['Sub Region'] = '';
            this.filterSubRegionValues = true;
            this.filterSubRegionValueCr = value;
            if (value != '') {
                this.loadDataSubRegion('ICS_SubRegion', value);
            }
            this.template.querySelectorAll('c-ics_comp_acpicklist').forEach(ele => {
                if (ele.name === 'Sub Region') {
                    ele.filterSubRegionValues = true;
                    ele.filterSubRegionValueCr = value;
                    ele.triggerValuesSubRegion();
                }
            })
        }
    }

    checkFieldOnTabOff(name) {
        this.sections.forEach(section => {
            section.fields.forEach(field => {
                if (this.isFieldMatching(name, field)) {
                    this.evaluateFieldError(name, field);
                }
            });
        });
    }

    isFieldMatching(name, field) {
        return name === field.name;
    }

    evaluateFieldError(name, field) {
        field.showError = false;
        if (this.shouldShowError(name, field)) {
            field.showError = true;
        }
    }

    shouldShowError(name, field) {
        return !this.formDetails[name] && !field.isHidden && field.isRequired;
    }

    genericFieldChange(event) {
        let value = event.target.value;
        let name = event.target.name;
        this.formDetails[name] = value;
        this.formDetailsEdit[name] = value;
        this.removeFieldErrors(name);
    }

    differenceInMonths(date1, date2) {
        const monthDiff = date1.getMonth() - date2.getMonth();
        const yearDiff = date1.getYear() - date2.getYear();
        return monthDiff + yearDiff * 12;
    }

    get today() {
        const today = new Date();
        return today.toISOString().split('T')[0];
    }

    get defaultValue() {
        return this.field.defaultValue || this.today;
    }

    selectedAccountDetails() {
        selectedAccount({
            'parentId': this.accId
        }).then(result => {
            const data = JSON.parse(result);
            if (data) {
                this.sections.forEach(sections => {
                    sections?.fields?.forEach(f => {
                        switch (f.name) {
                            case 'Selected Account':
                                f.selectedvalue = data['Selected Account'];
                                break;
                            case 'Selected Currencies':
                                f.selectedvalue = data['Selected Currencies']?.join(', ');
                                break;
                            case 'Debit Card':
                                f.selectedvalue = data['Debit Card'];
                                break;
                            case 'Currencies you would like a debit card':
                                f.selectedvalue = data['Currencies you would like a debit card']?.join(', ');
                                break;
                            default:
                                break;
                        }
                    });
                });
            }
        }).catch(error => {
            logger.debug('selectedAccount:' + JSON.stringify(error));
        });
    }

    getFieldsF(accountId) {
        this.initializeFields();
        this.sectionsSetup();
        this.isLoaded = false;
        loadAssessmentData({
            'pId': this.sections[Number(this.activeTab)].AccountId,
            'name': this.screenName,
        }).then(result => {
            let res = JSON.parse(result);
            if (Object.keys(res).length > 0) {
                this.formDetails = res;
                this.formDetailsEdit = res;
            } else {
                this.formDetails = {};
            }

            this.loadExisitngData(this.sections[Number(this.activeTab)].title);
            this.isLoaded = false;

        }).catch(e => {
            this.isLoaded = false;
            logger.debug('loadAssessmentData: ' + e);

        });

        this.formDetailsEdit = {};
    }

    fetchDynamicDataFromServer() {
        this.isLoaded = true;
        fetchDynamicData({
            'parentId': this.accId,
            'screenName': this.screenName,
            'sectionName': this.sections[Number(this.activeTab)].title
        })
            .then(result => {
                this.processDynamicDataResponse(result);
                this.isRadioLoad = true;
            })
            .catch(error => {
                this.isLoaded = false;
                logger.debug('fetchDynamicData:' + error);
            });
    }

    processDynamicDataResponse(result) {
        let res = JSON.parse(result);
        this.actualData = res;
        this.handleRegularData(res);
        this.loadExisitngData(this.sections[Number(this.activeTab)].title);
        this.isAlreadyLoaded = false;
        this.isLoaded = false;
    }

    handleRegularData(res) {
        this.processAccountResult(res);
    }

    processAccountResult(res) {
        this.accountResult = res.map(resMap => this.mapResult(resMap));
        this.updateFormDetails(res);
        this.updateAccountResultObj(res);
    }

    mapResult(resMap) {
        let resultId = {};
        let objId = {};
        let identityObj = {};
        if (resMap.objectName == 'IdentityDocument') {
            const fieldNameIdentity = `${Object.keys(resMap)} Id`;
            identityObj[fieldNameIdentity] = resMap['Id'];
        }
        if (resMap.objectName && resMap.objectName != 'IdentityDocument') {
            const colonId = Object.keys(resMap).filter(str => str.includes(':Id'));
            const fieldNameId = colonId;
            resMap[fieldNameId];
            resultId = Object.assign({}, ...fieldNameId.map(fieldName => ({
                [fieldName]: resMap[fieldName]
            })));

            const fieldName = resMap.objectName;
            const assest = resMap['Id'];
            objId = {
                [fieldName]: assest
            };
        }
        return Object.assign({}, resultId, objId, identityObj);
    }

    updateFormDetails(res) {
        let dataRetrive = {};
        for (let key in res) {
            if (res.hasOwnProperty(key)) {
                Object.assign(dataRetrive, res[key]);
            }
        }
        this.formDetails = dataRetrive || {};
    }

    updateAccountResultObj(res) {
        let dataRetriveObj = {};
        for (let i in res) {
            if (res.hasOwnProperty(i) && this.accountResult.hasOwnProperty(i)) {
                Object.assign(dataRetriveObj, this.accountResult[i]);
            }
        }
        this.accountResultObj = dataRetriveObj || {};
    }

    initializeFields() {
        this.formDetails = {};
        this.formDetailsEdit = {};
        this.accountResultObj = {};
        this.isLoaded = true;
        this.isFieldsLoaded = true;
        this.sections = this.sectionsDup;
    }

    sectionsSetup() {
        const activeTabIndex = Number(this.activeTab);
        this.sections.forEach((section, index) => {
            section.isActiveTab = index === activeTabIndex;
        });
    }

    async getFieldsWithoutAppApplication() {
        try {
            this.isLoaded = true;
            const result = await getFieldsWithoutAppId({
                'screenName': this.screenName
            });
            this.handleResult(result);
        } catch (error) {
            this.isLoaded = false;
            logger.debug('getFieldsWithoutAppApplication:' + error);
        }
    }

    toString(pObject) {
        return JSON.stringify(pObject).replaceAll('"', '').replaceAll(',', ', ').replaceAll(':', ': ').replaceAll('{', '').replaceAll('}', '');
    }

    async handleResult(result) {
        try {
            let detailsResult = await getDetails({ 'pId': this.recordId });
            console.log('detailsResult',detailsResult)
            detailsResult = JSON.parse(detailsResult);
            detailsResult.applicantDetails.reverse();
            this.groupedDetails = detailsResult.groupedDetails;
            console.log('groupedDetails:++++', JSON.stringify(detailsResult.groupedDetails));
            this.queue = detailsResult.queue;
            let sectionString = JSON.stringify(result.sections[0]);
            result.sections = [];
            for (let i = 0;
                i < detailsResult.applicantDetails.length;
                i++) {
                if (detailsResult.applicantDetails[i].tables) {
                    let section = JSON.parse(sectionString);
                    section.fields.forEach(field => {
                        if (field.isRequired) {
                            field.placeholder += '*';
                        }
                    });
                    section.title = detailsResult.applicantDetails[i].title;
                    section.tables = detailsResult.applicantDetails[i].tables;
                    console.log('#Data#section.tables='+JSON.stringify(section.tables));
                    section.AccountId = detailsResult.applicantDetails[i].AccountId;
                    section.OpportunityId = detailsResult.applicantDetails[i].OpportunityId;
                    this.getRequiredApprovalProcessesValueMethod(section.OpportunityId,section);
                    result.sections.push(section);
                }
            }

            this.screenTitle = result.title;
            this.screenSubtitle = result.subtitle;
            this.sections = result.sections.sort((a, b) => (a.rank > b.rank) ? 1 : -1);
            this.sections.forEach((section, index) => {
                this.handleCommonFields(section);
                section.fields.forEach(field => {
                    if(field.isRadio){
                        let clonedOptions = field.options.slice();
                        clonedOptions.forEach(option => {
                            option.nameValue = field.id + index;
                            option.labelValue = field.id + option.label + index
                        });
                        field.options = clonedOptions;
                        console.log('dsd',JSON.stringify(field.options))
                    }
                });
            });
            this.isAtScreenLoad = true;
            this.sectionsDup = this.sections;

            if (this.sections.length > 0) {
                this.getFieldsF(this.accId);
            } else {
                this.isLoaded = false;
                this.isAtScreenLoad = false;
            }
        } catch (error) {
            this.isLoaded = false;
            logger.debug('handleResult:' + error);
        }
    }
    getRequiredApprovalProcessesValueMethod(opportunityId,section){
        this.isLoaded = true;
        getRequiredApprovalProcessesValue({'opportunityId':opportunityId}).then(res=>{
            this.isLoaded = false;
            console.log('required approval process',res);
            const partEndingWithDollar = res.match(/[^;]+[^\.;]*\$$/);
            if (partEndingWithDollar) {
                partEndingWithDollar[0].match(/;([^;]*?)\./);
                if(partEndingWithDollar?.[0]){
                    const splistringWithDot = partEndingWithDollar?.[0]?.split('.');
                    const statusApproval = splistringWithDot[0];
                    if(statusApproval == 'AS' || statusApproval == 'AN'){
                        section.fields.forEach(f=>{
                            f.isHidden = true;
                            f.isHiddenTemplate = false;
                        })
                    } else if(statusApproval == 'FT'){
                        section.fields.forEach(f=>{
                            if(f.name == 'Likeness Photo Date' || f.name == 'Proof of Address Date' || f.name == 'Proof of Address Details' 
                                || f.name == 'Is applicants wealth fully understood and in line with their profile?' || f.name == 'Is the source of funds and expected account activity clear and understood?'){
                                    f.isHidden = true;
                                    f.isHiddenTemplate = false;
                                }
                        })
                    }
                    if(res){
                        section.fields.forEach(async f=>{
                            if(f.name == 'Post to chatter'){
                                this.isLoaded = true;
                                await getThePartyProfileId({recordId:section.AccountId}).then(partyProfileId=>{
                                    this.isLoaded = false;
                                    this.inputVariables[0]['value'] = partyProfileId;
                                    console.log('res',partyProfileId)
                                })
                                    f.isHidden = !res.endsWith('NC$');
                                    f.isHiddenTemplate = res.endsWith('NC$');
                                    
                            }
                        })
                    }

                }
            } 
        }).catch(error=>{
            this.isLoaded = false;
        })
    }

    reverseObject(data) {
        let returnVe = {};
        let keys = Object.keys(data);
        for (let i = keys.length - 1;
            i >= 0;
            i--) {
            returnVe[keys[i]] = data[keys[i]];
        }
        return (returnVe);
    }

    handleCommonFields() {
        this.sections.forEach((section, index) => {
            section.fields.forEach(fields => {
                this.setFieldGridClass(fields, section);
                this.handleHiddenFields(fields);
            });
            this.updateSectionTemplates(section);
            this.sortFieldsInSection(section);
        });
    }

    setFieldGridClass(fields, section) {
        if (fields.values) {
            fields.gridClass = `aob_form_input slds-col slds-m-top_small slds-small-size_1-of-${fields.values} ` +
                `slds-medium-size_1-of-${fields.values} slds-large-size_1-of-${fields.values}`;
        } else {
            fields.gridClass = section.gridClass;
        }
    }

    handleHiddenFields(fields) {
        if (fields.name === 'Province' || fields.name === 'Sub Region') {
            fields.isHidden = true;
            fields.isHiddenTemplate = false;
        }
    }

    updateSectionTemplates(section) {
        if (!section.isHidden) {
            section.isHiddenTemplate = true;
        }
        section.fields.forEach(field => {
            field.isMasterDetailTemplate = !field.isMasterDetail;
            field.isHiddenTemplate = !field.isHidden;
            field.isLookupTemplate = !field.isLookup;
            field.isHelpTextTemplate = !field.isHelpText;
            field.isOutputTemplate = !field.isOutput;
            field.isImageCheckboxTemplate = !field.isImageCheckbox;
            field.isConsentBoxTemplate = !field.isConsentBox;
            field.isCheckboxTemplate = !field.isCheckbox;
        });
    }

    sortFieldsInSection(section) {
        section.fields.sort((a, b) => parseFloat(a.order) - parseFloat(b.order));
    }

    handleAddressFields(section) {
        section.fields.forEach((fields) => {
            if ((fields.name == 'Sailing or motor yacht name' || fields.name == 'Length of time in yachting' ||
                fields.name == 'Length of time on this boat') && (this.productschemecode == '1' || this.productschemecode == '2')) {
                fields.isHidden = true;
                fields.isHiddenTemplate = false;
            }
        })
    }

    handleOperationOfAccount(section) {
        section.isHidden = !this.isJointAccount;
        section.isHiddenTemplate = !section.isHidden;
    }

    deleteAccordianFields(section) {
        section?.fields?.forEach(f => {
            if (f.issubAccordian) {
                f.deleteAccordian = true;
            }
        });
    }

    updateSelectedAccountFields(section) {
        section.isHidden = !this.isJointAccount;
        section.isHiddenTemplate = !section.isHidden;
        this.selectedAccountDetails();
        section.fields.forEach(fields => {
            if (fields.name === 'Would you like to open a Call Account?') {
                fields.helpTxt = this.label?.ics_helptext;
                fields.richformattedhelptext = true;
            }
            if (fields.name == 'Which address should the Visa Debit Card be delivered to?') {
                if (this.productschemecode != '3') {
                    let options = fields.options.filter(f => f.label != 'Alternative delivery address');
                    fields.options = options;
                }
            }
        });
    }

    async handlePersonalDetails(section) {
        try {
            const res = await fetchCountryCode({
                'accId': this.accId
            });
            this.countryOfResidence = res;
        } catch (error) {
            logger.debug('fetchCountryCode:' + error);
        }
    }

    get getPrePersonalDetails() {
        return true;
    }

    async loadDataProvince(sapfield, data) {
        await loadData({
            targetValue: sapfield
        }).then(result => {
            this.handleProvinceData(result, data);
        }).catch(error => {
            this.handleError(error);
        });
    }

    handleProvinceData(result, data) {
        const currentValues = result.filter(ele => {
            const code = ele.AOB_Code__c?.split(';')[0]?.toLowerCase();
            return code === data?.toLowerCase();
        });
        this.updateProvinceFields(currentValues);
    }

    updateProvinceFields(currentValues) {
        const sections = this.sections;
        const activeTabTitle = this.sections[Number(this.activeTab)].title;
        sections.forEach(section => {
            if (section.title === activeTabTitle) {
                section.fields.forEach(field => {
                    if (field.name === 'Province') {
                        this.updateProvinceField(field, currentValues);
                    }
                });
            }
        });
        this.sections = sections;
    }

    updateProvinceField(field, currentValues) {
        if (currentValues.length > 0) {
            if (this.sections[Number(this.activeTab)].title == 'Current Residential Address' && this.ProvinceName != undefined) {
                field.isHidden = true;
                field.isHiddenTemplate = false;
                this.formDetailsEdit['Sub Region'] = '';
                this.formDetailsEdit['Province'] = '';
            } else {
                field.isHidden = false;
                field.isHiddenTemplate = true;
                if (!this.formDetails['Province']) {
                    field.defaultValue = '';
                }
                this.filterProvinceValues = true;
                this.filterProvienceValueCR = this.formDetails['Country of Residence'] || this.formDetails['Country'];
                this.updateProvincePicklist(currentValues);
            }
        } else {
            field.isHidden = true;
            field.isHiddenTemplate = false;
            if (this.formDetails['Sub Region']) {
                this.formDetailsEdit['Sub Region'] = '';
            }
            if (this.formDetails['Province']) {
                this.formDetailsEdit['Province'] = '';
            }
        }
    }

    updateProvincePicklist(currentValues) {
        this.template.querySelectorAll('c-ics_comp_acpicklist').forEach(ele => {
            if (ele.name === 'Province') {
                ele.filterProvinceValues = true;
                ele.filterProvienceValueCr = this.formDetails['Country of Residence'] || this.formDetails['Country'];
                ele.values = currentValues;
                ele.triggerValuesProvince();
            } else {
                if (this.formDetails['Province']) {
                    this.filterSubRegionValues = true;
                    this.filterSubRegionValueCr = this.formDetails['Province'];
                    this.loadDataSubRegion('ICS_SubRegion', this.formDetails['Province']);
                }
            }
        });
    }

    handleError(error) {
        this.isLoaded = false;
        this.sections.forEach(section => {
            if (section.title === this.sections[Number(this.activeTab)].title) {
                section.fields.forEach(field => {
                    if (field.name === 'Province') {
                        field.isHidden = true;
                        field.isHiddenTemplate = false;
                        logger.debug('loadDataProvince:' + error);
                    }
                });
            }
        });
    }

    loadDataSubRegion(sapfield, data) {
        loadData({
            targetValue: sapfield
        }).then(result => {
            this.handleSubRegionData(result, data);
        }).catch(error => {
            this.handleErrorSub(error);
        });
    }

    handleSubRegionData(result, data) {
        const currentValues = result.filter(ele => {
            const code = ele.AOB_Code__c?.split(';')[0]?.toLowerCase();
            const dataSplit = data?.split(';')[1]?.toLowerCase();
            return code === dataSplit;
        });
        if (currentValues.length > 0) {
            this.updateSubRegionFields(currentValues, data);
        } else {
            this.hideSubRegionFields();
            this.formDetailsEdit['Sub Region'] = '';
        }
    }

    updateSubRegionFields(currentValues, data) {
        const activeTabTitle = this.sections[Number(this.activeTab)].title;
        this.sections.forEach(section => {
            if (section.title === activeTabTitle) {
                section.fields.forEach(field => {
                    if (field.name === 'Sub Region') {
                        this.showSubRegionField(field, currentValues, data);
                    }
                });
            }
        });
    }

    showSubRegionField(field, currentValues, data) {
        field.isHidden = false;
        field.isHiddenTemplate = true;
        this.template.querySelectorAll('c-ics_comp_acpicklist').forEach(ele => {
            if (ele.name === 'Sub Region') {
                ele.filterSubRegionValues = true;
                ele.filterSubRegionValueCr = data;
                ele.values = currentValues;
                ele.triggerValuesSubRegion();
            }
        });
    }

    hideSubRegionFields() {
        this.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.name === 'Sub Region' && field.isHiddenTemplate) {
                    field.isHidden = true;
                    field.isHiddenTemplate = false;
                }
                if (field.name === 'Sub Region' && this.formDetails['Sub Region']) {
                    field.isHidden = false;
                    field.isHiddenTemplate = true;
                }
            });
        });
    }

    handleErrorSub(error) {
        this.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.name === 'Sub Region') {
                    field.isHidden = true;
                    field.isHiddenTemplate = false;
                    logger.debug('loadDataSubRegion:' + error);
                }
            });
        });
    }

    loadExisitngData(title) {
        if (!this.formDetails) return;
        this.updatePreviousEmploymentDetailsVisibility();
        this.loadFormDataByTitle(title);
        this.handleDualEmploymentDetails();
        this.handleInstructingTheBank();
        this.handleStartDate();
        this.isPicklistLoaded = false;
    }

    handleStartDate() {
        if (this.formDetails?.['Start Date'] && this.screenName == 'ICS UK Employment Details' && this.sections[Number(this.activeTab)].title == 'Current Employment Details') {
            const currentDate = new Date();
            const userSelectedStartDate = new Date(this.formDetails?.['Start Date']);
            this.calculatedMonths = this.differenceInMonths(currentDate, userSelectedStartDate);
            if (this.calculatedMonths >= 12) {
                this.skipPreviousEmploymentDetails = true;
                this.sections.forEach(f => {
                    if (f.title == 'Previous Employment Details') {
                        f.isHidden = true;
                        f.isHiddenTemplate = false;
                    }
                });
            }
        }
    }

    updatePreviousEmploymentDetailsVisibility() {
        this.sections.forEach(section => {
            if (section.title === 'Previous Employment Details') {
                section.isHidden = this.skipPreviousEmploymentDetails;
                section.isHiddenTemplate = !this.skipPreviousEmploymentDetails;
            }
        });
    }

    loadFormDataByTitle(title) {
        for (let section of this.sections) {
            if (section.title === title) {
                this.loadFormDataForSection(section);
            }
        }
    }

    loadFormDataForSection(section) {
        this.loadTrustsData(section);
        for (let field of section.fields) {
            if (this.formDetails[field.name]) {
                this.loadFieldData(field);
                this.handleSpecialCases(field);
                this.handleParentControlledFields(field);
            }
        }
        this.sortSectionFields(section);
    }

    handleParentControlledFields(field) {
    }

    loadTrustsData(section) {
        if (section.title === 'Trusts') {
            this.formDetails['Accordian Count'] = this.formDetails?.['accordian']?.length;
            this.count = this.formDetails['Accordian Count'];
        }
    }

    loadFieldData(field) {
        field.defaultValue = this.formDetails[field.name];
        if (field.isCurrency) {
            let currencyName = field.name + 'Currency';
            field.selectedCurrencyValue = this.formDetails[currencyName] ? this.formDetails[currencyName] : '';
            field.defaultValue = this.formDetails[currencyName]?.split(':')[1];
            this.formDetails[field.name] = this.formDetails[currencyName]?.split(':')[1] ? this.formDetails[currencyName]?.split(':')[1] : undefined;
        }
        if (field.name === 'I don\'t have a bank account' && this.formDetails[field.name]) {
            this.template.querySelector('.checkBox').checked = this.formDetails[field.name] === 'TRUE';
        }
        if ((field.name === 'Country of Residence' || field.name === 'Country') && !field.isHidden) {
            this.loadDataProvince('ICS_Province', this.formDetails['Country']);
        }
    }

    handleSpecialCases(field) {
        for (let section of this.sections) {
            this.handleFieldsInSection(section, field);
            this.updateInputValues(field);
            this.updatePicklistValues(field);
        }
        if (field.name == 'Is this your own bank account?') {
            this.getBankAccountValues();
        }
    }

    handleFieldsInSection(section, field) {
        for (let sectionField of section.fields) {
            if (sectionField.parent == field.id && !field.isHidden) {
                this.handleParentControlledField(sectionField, field);
            }
        }
        this.sortSectionFields(section);
    }

    handleParentControlledField(sectionField, field) {
        if (this.formDetails[field.name] == sectionField.parentControllingValue) {
            sectionField.isHidden = false;
            sectionField.isHiddenTemplate = true;
        } else {
            sectionField.isHidden = true;
            sectionField.isHiddenTemplate = false;
        }
        this.handleSpecialCaseFields(sectionField, field);
    }

    handleSpecialCaseFields(sectionField, field) {
        if (field.name == 'Select multi combobox of assests' || field.name == 'Select multi combobox' || field.name == 'How do you intend to fund the future deposits?') {
            this.handleMultiComboboxField(sectionField, field);
        } else if (field.name == 'Accordian Count') {
            this.handleAccordianCountField(sectionField, field);
        } else if (field.name == 'IndustryF' || field.name == 'Industry') {
            this.handleIndustryField(sectionField, field);
        } else if (this.sections[Number(this.activeTab)].title == 'Tax Certificates' && field.name == 'Please select one or more countries') {
            this.handleCountriesTaxCertificates(sectionField, field);
        } else {
            this.handleDefaultField(sectionField, field);
        }
    }
    handleCountriesTaxCertificates(sectionField, field) {
        if (sectionField.parent == field.id) {
            if (this.formDetails?.[sectionField.name]) {
                if (sectionField.parentControllingValue.toLowerCase() == sectionField.name.toLowerCase()) {
                    this.showField(sectionField)
                    sectionField.subAccordian = true;
                    sectionField.isLookupTemplate = true;
                    sectionField.overallData = this.formDetails?.[sectionField.name];
                    this.updateParentAccordianData(sectionField);
                }
            }
        }
    }

    handleMultiComboboxField(sectionField, field) {
        if (typeof this.formDetails?.[field.name] === 'string') {
            if (this.formDetails?.[field.name]?.toLowerCase().includes(sectionField.parentControllingValue?.toLowerCase())) {
                this.showField(sectionField);
                this.updateMultiComboboxData(sectionField, field);
            } else {
                this.hideField(sectionField);
            }
        }
    }

    updateMultiComboboxData(sectionField, field) {
        let data;
        if (field.name == 'Select multi combobox of assests') {
            data = this.formDetails[sectionField.parentControllingValue + 'V'];
        } else if (field.name == 'How do you intend to fund the future deposits?') {
            data = this.formDetails[sectionField.parentControllingValue + 'Vvv'];
        } else {
            data = this.formDetails[sectionField.parentControllingValue + 'W'];
        }
        sectionField.isCheckLabel = this.label?.ics_this_is_listed_in_assets;
        sectionField.subAccordian = true;
        sectionField.completeData = true;
        sectionField.overallData = data;
        this.updateParentAccordianData(sectionField);
    }

    updateParentAccordianData(sectionField) {
        this.template.querySelectorAll('c-ics_comp_parent-accordian').forEach(f => {
            if (sectionField.parentControllingValue == f.dataset.label) {
                f.defaultData = sectionField.overallData;
                f.triggerData();
            }
        });
    }

    handleAccordianCountField(sectionField, field) {
        if (sectionField.name == 'accordian') {
            this.showField(sectionField);
            this.updateAccordianData(sectionField);
        }
    }

    updateAccordianData(sectionField) {
        let data = this.formDetails['accordian'];
        sectionField.subAccordian = true;
        sectionField.completeData = true;
        sectionField.overallData = data;
        this.updateParentAccordianData(sectionField);
    }

    handleIndustryField(sectionField, field) {
        let fieldNameText = field.name;
        if (this.formDetails[fieldNameText]) {
            let splitData = this.formDetails[fieldNameText].split(';');
            if (splitData?.[1]) {
                if (splitData[1] == 'Restricted') {
                    this.handleRestrictedIndustry(sectionField);
                }
            } else {
                this.handleNonRestrictedIndustry(sectionField);
            }
        }
    }

    handleRestrictedIndustry(sectionField) {
        if (((sectionField.name == 'OccupationF' || sectionField.name == 'Occupation') && sectionField.isCombobox) || (sectionField.name == 'sharesCompany')) {
            this.showField(sectionField);
        }
    }

    handleNonRestrictedIndustry(sectionField) {
        if ((sectionField.name == 'OccupationF' || sectionField.name == 'Occupation') && sectionField.isInput) {
            this.showField(sectionField);
        }
    }

    handleDefaultField(sectionField, field) {
        if (typeof this.formDetails?.[field.name] === 'string') {
            if (sectionField?.parentControllingValue?.toLowerCase().includes(this.formDetails?.[field.name]?.toLowerCase())) {
                this.showField(sectionField);
            } else {
                this.hideField(sectionField);
            }
        }
    }

    updateInputValues(field) {
        this.template.querySelectorAll('input').forEach(f => {
            if (field.name == f.name) {
                if (this.formDetails[field.name]) {
                    f.value = this.formDetails[field.name];
                }
            }
        });
    }

    updatePicklistValues(field) {
        this.template.querySelectorAll('c-ics_comp_acpicklist').forEach(f => {
            if (field.name == f.dataset.name) {
                if (this.formDetails[field.name]) {
                    f.value = this.formDetails[field.name];
                    f.valueDefault = null;
                    f.setExistingDataOnDefault();
                }
            }
        });
    }

    showField(sectionField) {
        sectionField.isHidden = false;
        sectionField.isHiddenTemplate = true;
    }

    hideField(sectionField) {
        sectionField.isHidden = true;
        sectionField.isHiddenTemplate = false;
    }

    sortSectionFields(section) {
        section.fields.sort((a, b) => parseFloat(a.order) - parseFloat(b.order));
    }

    handleDualEmploymentDetails() {
        if (this.formDetails?.['Please confirm if this is your only employment'] === 'FALSE') {
            this.isDualEmployment = true;
            this.sections.forEach(section => {
                if (section.title === 'Dual Employment Details') {
                    section.isHidden = false;
                    section.isHiddenTemplate = true;
                }
            });
        }
        this.sections.forEach(section => {
            if (section.title === 'Dual Employment Details') {
                if (this.isDualEmployment) {
                    section.isHidden = false;
                    section.isHiddenTemplate = true;
                } else {
                    section.isHidden = true;
                    section.isHiddenTemplate = false;
                }
            }
        });
    }

    handleInstructingTheBank() {
        this.sections.forEach(section => {
            if (section.title === 'Instructing the Bank') {
                section.fields.forEach(field => {
                    if (field.name === 'consent1') {
                        this.template.querySelectorAll('input').forEach(inputField => {
                            if (inputField.dataset.name === field.name) {
                                inputField.checked = true;
                                this.formDetails[field.name] = true;
                            }
                        });
                    }
                });
            }
        });
    }

    addApplicant(event) {
        this.count++;
        const id = event.currentTarget.dataset.id;
        const index = event.currentTarget.dataset.index;
        for (const section of this.sections) {
            const fields = section.fields.filter(field => field.parent === id && Number(this.activeTab) === Number(index));
            this.updateFieldsVisibility(fields);
            this.updateAccordianFields(fields);
        }
    }

    updateFieldsVisibility(fields) {
        for (const field of fields) {
            field.isHidden = false;
            field.isHiddenTemplate = true;
        }
    }

    updateAccordianFields(fields) {
        this.template.querySelectorAll('c-ics_comp_parent-accordian').forEach(accordian => {
            if (fields.some(field => field.id === accordian.dataset.id)) {
                accordian.screenName = this.screenName;
                accordian.sections = this.sections;
                accordian.accId = accordian.dataset.acc;
                accordian.sectionName = accordian.dataset.tab;
                accordian.count = this.count;
                accordian.addApplicant();
            }
        });
    }

    removeApplicant() {
        if (this.count > 1) {
            this.count = this.count - 1;
            this.template.querySelectorAll('c-ics_comp_parent-accordian').forEach(ele => {
                ele.removeAccordian();
            })
        }
    }

    genericCheckboxChange(event) {
        const name = event.target.dataset.name;
        const value = event.target.checked;
        this.formDetails[name] = value;
        this.removeFieldErrors(name);
        const checkbox = event.target;
        const checked = checkbox.checked;
        const lightningInput = checkbox.closest('.consent');
        if (checked) {
            lightningInput.setCustomValidity('');
        }
        lightningInput.reportValidity();
    }

    genericRadioChange(event) {
        const name = event.target.dataset.fieldname;
        console.log('nameradio',name)
        const value = event.target.dataset.value;
        this.formDetails[name] = value;
        this.formDetailsEdit[name] = value;
        const id = event.target.dataset.id;
        this.removeFieldErrors(name);
        this.updateFieldsVisibilityRadio(id, value, name);
    }

    updateAccordian(accordianId) {
        this.template.querySelectorAll('c-ics_comp_parent-accordian').forEach(f => {
            if (f.dataset.id === accordianId) {
                f.screenName = this.screenName;
                f.sections = this.sections;
                f.accId = f.dataset.acc;
                f.sectionName = f.dataset.tab;
                f.addApplicant();
            }
        });
    }

    /**
    * @description Method to update field visibility
    */
    updateFieldsVisibilityRadio(id, value, name) {
        this.sections.forEach(section => {
            section.fields.forEach(field => {
                
                if (field.parent === id) {
                    console.log('ff',field.id,value)
                    this.updateFieldVisibilityRadioSub(field, value, name);
                }
            });
        });
    }
    /**
    * @description Method to update field visibility Radiosub
    */
    updateFieldVisibilityRadioSub(field, value, name) {
        if (value === field.parentControllingValue) {
            this.handleMatchingFieldSubRadio(field, name);
        } else {
            this.hideDependentFields(field);
        }
    }
    /**
    * @description Method to handle Match field visibility Radiosub
    */
    handleMatchingFieldSubRadio(field, name) {
        field.defaultValue = '';
        this.formDetails[field.name]=undefined;
        console.log('ff',field.defaultValue);
        field.showError = false; field.isHidden = false; field.isHiddenTemplate = true;
    }

    /**
     * @description Method to hide dependent fields
     */
    hideDependentFields(parentField) {
        parentField.isHidden = true; parentField.isHiddenTemplate = false; parentField.defaultValue = ''; delete this.formDetails[parentField.name];
        for (const field of this.sections.flatMap(sec => sec.fields)) {
            if (field.parent === parentField.id) { this.hideDependentFields(field); }
        }
    }

    removeFieldErrors(name) {
        for (const section of this.sections) {
            for (const field of section.fields) {
                if (field.name === name && this.formDetails[field.name]) {
                    if (field.ispicklistWithInput) {
                        this.handlePicklistWithInputFieldError(field);
                    } else {
                        this.handleRegularFieldError(field);
                        field.showError = false;
                    }
                }
            }
        }
    }

    handlePicklistWithInputFieldError(field) {
        const patternRegExp = new RegExp(field.pattern);
        if (patternRegExp.test(this.formDetails[field.name])) {
            field.showErrorMobile = false;
        } else {
            field.errorMessageMobile = this.phoneNumberErrorMessage;
            field.showErrorMobile = true;
            field.showError = false;
        }
    }

    handleRegularFieldError(field) {
        const patternRegExp = new RegExp(field.pattern);
        if (patternRegExp.test(this.formDetails[field.name])) {
            field.showPatternError = false;
        } else {
            field.showPatternErrorMsg = field.errorMessage;
            field.showPatternError = true;
        }
    }

    checkForm() {
        let isValid = true;
        let isvalidParentAccordianData = true;
        this.sections.forEach((section, j) => {
            if (Number(j) === Number(this.activeTab) && section.title !== 'Applications' && !this.active) {
                isValid = this.checkSectionFields(section.fields);
            }
        });

        if (this.template.querySelector('c-ics_comp_parent-accordian')) {
            this.template.querySelectorAll('c-ics_comp_parent-accordian').forEach(f => {
                isvalidParentAccordianData = f.triggerBlur();
            });
        }

        return isValid && isvalidParentAccordianData;
    }

    checkSectionFields(fields) {
        let isValid = true;

        fields.forEach(field => {
            field.showError = false;

            if (!field.isHidden && field.isRequired) {
                const isFieldValid =
                    this.validateRequiredField(field) && this.validatePatternField(field) &&
                    this.validateMobileNumber(field) && this.validateUniqueValues(field);

                if (!isFieldValid) {
                    isValid = false;
                }
            }
        });

        return isValid;
    }

    /**
     * @description Method to validate Required Field
     */
    validateRequiredField(field) {
        if (!this.formDetails[field.name]) {
            if (!field.showMsg) {
                field.showError = true;
            }
            return false;
        }
        return true;
    }

    validatePatternField(field) {
        if (this.formDetailsEdit[field.name] && field.pattern) {
            let regularExp = new RegExp(field.pattern);
            if (!regularExp.test(this.formDetailsEdit[field.name])) {
                if (field.ispicklistWithInput) {
                    field.showErrorMobile = true;
                    field.errorMessageMobile = this.phoneNumberErrorMessage;
                } else {
                    field.showPatternError = true;
                    field.showPatternErrorMsg = field.errorMessage;
                    field.showError = false;
                }
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    validateMobileNumber(field) {
        if (field.name === 'Alternative Contact Number') {
            field.showMobileValidationError = this.formDetails['Contact Number'] === this.formDetailsEdit['Alternative Contact Number'];
            return !field.showMobileValidationError ? true : false;
        } else {
            return true
        }
    }

    validateUniqueValues(field) {
        if (['Code word', 'Favourite sport or colour', 'Mother’s Former Name', 'Name of your first School']?.includes(field.name)) {
            let valuesFormDetails = Object.values(this.formDetails);
            let isDuplicate = valuesFormDetails.some((element, index) => valuesFormDetails.indexOf(element) !== index);
            if (isDuplicate) {
                this.pleaseSelectUniqueValues = true;
                this.modalErrorMsg = 'Please select unique names';
                return false;
            } else {
                return true;
            }
        } else {
            return true;
        }
    }

    closeUniqueError() {
        this.pleaseSelectUniqueValues = false;
    }

    async continueToNextPage(event) {
        if (this.shouldHandleBankAccount()) {
            this.handleBankAccount();
        }
        let url_string = window.location;
        if (url_string?.pathname.includes('/ifa')) {
            this.isIFA = true;
        }
        this.removeUndefinedKeys();
        if (!this.validateAccordions()) {
            return;
        }
        if (!this.checkForm()) {
            return;
        }
        if (this.shouldSelectMinPreviousAddress()) {
            this.pleaseSelectUniqueValues = true;
            this.modalErrorMsg = 'Please add minimum three years of your previous residential address details to continue';
            return;
        }
        await this.performDMLInsert();
        if (this.shouldNavigate()) {
            this.navigate();
        } else {
            this.loadNextTab();
        }
    }

    shouldHandleBankAccount() {
        return Number(this.activeTab) === 0 && this.screenName === 'ICS UK Financial Details' && !this.formDetails["I don't have a bank account"];
    }

    handleBankAccount() {
        this.formDetails["I don't have a bank account"] = 'FALSE';
    }

    removeUndefinedKeys() {
        Object.keys(this.formDetails).forEach(key => {
            if (key === 'undefined') {
                delete this.formDetails[key];
            }
        });
        Object.assign(this.formDetailsEdit, this.accountResultObj)
    }

    validateAccordions() {
        let isValid = true;
        let isValidDependent = true;
        if (this.template.querySelector('c-ics_comp_parent-accordian')) {
            this.template.querySelectorAll('c-ics_comp_parent-accordian').forEach(f => {
                isValid = f.triggerBlur();
                if (!isValid) {
                    isValidDependent = false;
                }
            });
        }
        return isValidDependent;
    }

    shouldSelectMinPreviousAddress() {
        return this.calculatedYears < 3 && Number(this.activeTab) === 3 && this.screenName === 'ICS UK Personal Info';
    }

    shouldNavigate() {
        return Number(this.activeTab) === this.sections.length - 1;
    }

    navigate() {
        if (this.buttonText === 'Submit') {
            this.isLoaded = true;
            submitApplicationForm({ 'parentId': this.accId }).then(res => {
                this.isLoaded = false;
                this[NavigationMixin.Navigate]({
                    type: 'comm__namedPage',
                    attributes: {
                        name: 'Success_Page__c',
                    }
                });
            }).catch(error => {
                this.isLoaded = false;
                logger.debug('submit Application Form:' + error);
            })
        } else {
            this.isAlreadyLoaded = false;
            updateSectionName({ parentId: this.accId, screen: this.nextScreen }).then(res => {
                this.isLoaded = false;
                if (this.availableActions.find(action => action === this.constants.NEXT)) {
                    this.dispatchEvent(new CustomEvent('flowNavigationNext'));
                    const navigateNextEvent = new FlowNavigationNextEvent();
                    this.dispatchEvent(navigateNextEvent);
                }
            }).catch(error => {
                this.isLoaded = false;
                logger.error('Error backToPreviousPage:', error)
            })
        }
    }

    loadNextTab() {
        this.isAlreadyLoaded = false;
        this.getFieldsF(this.accId);
    }

    closeSaveModal() {
        this.isSaveAndExit = false;
    }

    async backToPreviousPage(event) {
        if (this.shouldNavigateBack()) {
            this.navigateBack();
        } else {
            const tabIndex = this.calculateTabIndex();
            this.updateTabIndex(tabIndex);
            this.getFieldsF();
        }
    }

    shouldNavigateBack() {
        return this.screenName !== 'ICS UK Personal Info' && Number(this.activeTab) === 0;
    }

    navigateBack() {
        this.BackButton = true;
        this.dispatchEvent(new FlowAttributeChangeEvent('BackButton', true));
        this.isLoaded = true;
        updateSectionName({ parentId: this.accId, screen: this.previousScreen }).then(res => {
            this.isLoaded = false;
            if (this.availableActions.find(action => action === this.constants.NEXT)) {
                const navigateNextEvent = new FlowNavigationNextEvent();
                this.dispatchEvent(navigateNextEvent);
            }
        }).catch(error => {
            this.isLoaded = false;
            logger.error('Error backToPreviousPage:', error)
        })
    }

    calculateTabIndex() {
        let tabIndex;
        if (this.isDualEmployment && Number(this.activeTab) === 0) {
            tabIndex = Number(this.activeTab) - 1;
        } else if (!this.isDualEmployment && Number(this.activeTab) === 2 && this.screenName === 'ICS UK Employment Details') {
            tabIndex = Number(this.activeTab) - 2;
        } else {
            if (this.skipPreviousEmploymentDetails && !this.isDualEmployment && Number(this.activeTab) === 3) {
                tabIndex = Number(this.activeTab) - 3;
            } else if (this.skipPreviousEmploymentDetails && this.isDualEmployment && Number(this.activeTab) === 3) {
                tabIndex = Number(this.activeTab) - 2;
            } else if (!this.isAdditionalBankAcc && Number(this.activeTab) === 2 && this.screenName === 'ICS UK Financial Details') {
                tabIndex = Number(this.activeTab) - 2;
            } else if (this.isJointTab === 'false' && Number(this.activeTab) === 4 && this.screenName === 'ICS UK Account Details') {
                tabIndex = Number(this.activeTab) - 2;
            } else {
                tabIndex = Number(this.activeTab) - 1;
            }
        }
        return tabIndex;
    }

    updateTabIndex(tabIndex) {
        this.activeTab = tabIndex.toString();
        updateSectionName({
            parentId: this.accId, screen: this.screenName + ';' + this.sections[Number(this.activeTab)].title
        }).then(res => { }).catch(error => {
            this.isLoaded = false;
            logger.error('Error backToPreviousPage:', error)
        })
    }

    handleSelectOptionList(event) {
        const values = event.detail.value;
        const name = event.target.dataset.name;
        const selectedNoneValue = event.detail.noneValue;
        this.updateFieldVisibilityMulti(values, name, selectedNoneValue, event);
        this.updateFormDetailsMulti(name, values, selectedNoneValue);
        this.removeFieldErrors(name);
    }

    updateFieldVisibilityMulti(values, name, selectedNoneValue, event) {
        this.sections.forEach(section => {
            section.fields.forEach(field => {
                if (field.parent === event.target.dataset.id) {
                    const parentControllingValue = field.parentControllingValue;
                    if (parentControllingValue && values.includes(parentControllingValue)) {
                        this.updateFieldAttributesMulti(field, name);
                    } else {
                        field.isHidden = true;
                        field.isHiddenTemplate = false;
                    }
                }
            });
            this.sortFieldsInSection(section)
        });
    }

    updateFieldAttributesMulti(field, name) {
        field.isHidden = false;
        field.isHiddenTemplate = true;
        field.isLookupTemplate = true;
        if (name === 'Select multi combobox' || name === 'Select multi combobox of assests' || name === 'How do you intend to fund the future deposits?') {
            field.subAccordian = true;
            if (name === 'How do you intend to fund the future deposits?') {
                field.isCheckLabel = this.label?.ics_this_is_listed_in_assets;
            }
        }
    }

    updateFormDetailsMulti(name, values, selectedNoneValue) {
        const selectedValues = selectedNoneValue ? 'None' : values.join(';');
        this.formDetails[name] = selectedValues;
        this.formDetailsEdit[name] = selectedValues;
    }

    deleteAnother(event) {
        let value = event.target.dataset.value;
        let parentId = event.target.dataset.parent
        this.template.querySelectorAll('c-ics_comp_multi-picklist').forEach(ele => {
            if (ele.dataset.id == parentId) {
                ele.closePillValue = value;
                ele.closePill();
            }
        })
    }

    accordianClick(event) {
        const id = event.currentTarget.dataset.id;
        const accordionContent = this.template.querySelectorAll(".accordion-content");
        accordionContent.forEach(item => {
            if (id == item.dataset.id) {
                item.classList.toggle("is-open");
                this.toggleAccordionContent(id, item.classList.contains("is-open"));
                this.removeOpenedContent(id);
            }
        });
    }

    toggleAccordionContent(id, isOpen) {
        const description = this.template.querySelectorAll(`[data-id="${id}"].accordion-content-description`);
        const addAnother = this.template.querySelectorAll(`[data-id="${id}"].addAnother`);
        const lightningIcon = this.template.querySelectorAll(`[data-id="${id}"].lightning-icon`);
        const primaryApplicantProperties = this.template.querySelectorAll(`[data-id="${id}"].primaryApplicantProperties`);
        description.forEach(f => {
            f.style.height = isOpen ? "auto" : "0px";
            f.style.display = isOpen ? 'block' : 'none';
        });
        addAnother.forEach(f => {
            f.classList.toggle('parentAddAnotherBtn', !isOpen);
        });
        lightningIcon.forEach(f => {
            f.iconName = isOpen ? 'utility:chevrondown' : 'utility:chevronright'
        });
        primaryApplicantProperties.forEach(f => {
            f.style.display = isOpen ? "none" : "block";
        });
    }

    removeOpenedContent(id) {
        const accordionContent = this.template.querySelectorAll(".accordion-content");
        accordionContent.forEach((item2) => {
            if (item2.dataset.id != id) {
                item2.classList.remove("is-open");
                this.hideAccordionContent(item2, id);
                this.resetAccordionButtons();
            }
        });
    }

    hideAccordionContent(item, id) {
        const description = item.querySelectorAll(".accordion-content-description");
        const addAnother = item.querySelectorAll(".addAnother");
        const primaryApplicantProperties = item.querySelectorAll(".primaryApplicantProperties");
        const lightningIcon = this.template.querySelectorAll(`.lightning-icon`);
        description.forEach((f) => {
            if (id != f.dataset.id) {
                f.style.height = "0px";
                f.style.display = 'none';
            }
        });
        lightningIcon.forEach((f) => {
            if (id != f.dataset.id) {
                f.iconName = 'utility:chevronright';
            }
        });
        addAnother.forEach((f) => {
            if (id != f.dataset.id) {
                f.classList.add('parentAddAnotherBtn');
            }
        });
        primaryApplicantProperties.forEach((f) => {
            if (id != f.dataset.id) {
                f.style.display = "block"
            }
        });
    }

    resetAccordionButtons() {
        const icon = this.template.querySelector("i");
        if (icon) {
            icon.classList.replace("fa-minus", "fa-plus");
        }
    }

    handleData(event) {
        this.formDetails[event.detail.name] = event.detail.data;
        this.formDetailsEdit[event.detail.name] = event.detail.data
    }

    changePicklistValue(event) {
        this.arrangeValues(event);
    }
    changeCurrencylistValue(event) {
        let selectedCurrency = event.detail?.selectedCurrencyValue ? event.detail?.selectedCurrencyValue : 'AED';
        this.arrangeValues(event);
        this.formDetails[event.target.dataset.name + 'Currency'] = selectedCurrency + ':' + event.detail.value;
        this.formDetailsEdit[event.target.dataset.name + 'Currency'] = selectedCurrency + ':' + event.detail.value;
    }

    arrangeValues(event) {
        this.formDetails[event.detail.name] = event.detail.value;
        this.formDetailsEdit[event.detail.name] = event.detail.value;
        this.removeFieldErrors(event.detail.name);
    }

    closeModal(event) {
        this.isAddAddressModal = false;
    }

    insertClose() {
        this.isAddAddressModal = false;
        this.template.querySelector('c-ics_comp_previousresidentialtable').triggerBlur();
    }

    handleAddAnother(event) {
        const id = event.target.dataset.id;
        this.updateAccordian(id);
        this.addAnotherLoop(id);
    }

    updateAccordian(id) {
        this.template.querySelectorAll('c-ics_comp_parent-accordian').forEach(f => {
            if (f.dataset.id === id) {
                f.screenName = this.screenName;
                f.sections = this.sections;
                f.accId = f.dataset.acc;
                f.sectionName = f.dataset.tab;
                f.addApplicant();
            }
        });
    }

    /**
     * @description method to add Another Loop
     */
    addAnotherLoop(id) {
        this.sections.forEach(section => {
            const fields = section.fields;
            if (Array.isArray(fields)) {
                fields.forEach(field => {
                    if (field?.id === id) {
                        this.updateFieldCompleteness(field);
                    }
                });
            }
        });
    }

    updateFieldCompleteness(field) {
        field.completeData = false;
        this.renderAccordian = true;
        this.IdAccordian = field.id;
    }

    fieldsComplete(event) {
        const id = event.target.dataset.id;
        for (const section of this.sections) {
            for (const field of section.fields) {
                if (field.id === id) {
                    field.completeData = true;
                    this.renderAccordian = true;
                    this.IdAccordian = field.id;
                }
            }
        }
        this.updateElementVisibility(id, ".addAnother", "parentAddAnotherBtn");
        this.updateElementDisplayStyle(id, ".primaryApplicantProperties", "none");
    }

    updateElementVisibility(id, selector, className) {
        const elements = this.template.querySelectorAll(selector);
        elements.forEach(element => {
            if (id === element.dataset.id) {
                element.classList.remove(className);
            }
        });
    }

    updateElementDisplayStyle(id, selector, styleValue) {
        const elements = this.template.querySelectorAll(selector);
        elements.forEach(element => {
            if (id === element.dataset.id) {
                element.style.display = styleValue;
            }
        });
    }

    fieldsIncomplete(event) {
        const id = event.target.dataset.id;
        for (const section of this.sections) {
            for (const field of section.fields) {
                if (field.id === id) {
                    this.updateFieldCompleteness(field);
                }
            }
        }
    }

    deleteSelfAccordianCount(event) {
        this.count = this.count - 1;
    }

    addFieldErrors(name, condition) {
        for (const section of this.sections) {
            for (const field of section.fields) {
                if (field.name === name && field.isButton) {
                    field.showError = condition;
                }
            }
        }
    }

    genericButtonClick(event) {
        let name = event.target.dataset.name;
        switch (name) {
            case 'Save':
                if (this.checkForm()) {
                    this.isLoaded = true;
                    event.target.disabled = true;

                    this.formDetailsEdit.name = this.screenName;
                    this.formDetailsEdit.pId = this.sections[this.activeTab].AccountId;
                    this.formDetailsEdit.OpportunityId = this.sections[this.activeTab].OpportunityId;

                    saveAssessmentData({
                        'jsonString': JSON.stringify(this.formDetailsEdit)
                    }).then(res => {
                        event.target.disabled = true;
                        this.isLoaded = false;
                    }).catch(e => {
                        this.isLoaded = false;
                        this.addFieldErrors(name, true);
                        this.template.querySelectorAll('[data-name="' + name + '"]')[0].disabled = false;
                        logger.debug('saveAssessmentData->save:' + e);
                    });
                }
                break;
            case 'Post to chatter' :
                this.renderFlow = true;
                break;
            default:
                break;
        }
    }
      /**
     * @description Method to handle flow status change
     */
      handleStatusChange(event) {
        // this.isLoaded = true;
        if (event.detail.status === 'FINISHED_SCREEN' || event.detail.status == 'FINISHED' || event.detail.status == 'WAITING') {
            this.isLoaded = false;
            this.renderFlow = false;
            this.sections.forEach(section=>{
                section.fields.forEach(field=>{
                    if(field.name == 'Post to chatter'){
                        field.disabled = true;
                    }
                })
            })
        }
    }
}
