<template>
  <PageLayout title="เบิกสวัสดิการทั่วไป (ค่าทำฟันเพื่อการรักษา)">
    <template v-slot:page>
      <!--General Information Section -->
      <div class="row q-col-gutter-md q-pl-md q-pt-md">
        <div :class="isView ? 'col' : 'col-md-9 col-12'">
          <q-card flat bordered class="full-height">
            <q-card-section class="font-18 font-bold">
              <p class="q-mb-none">ข้อมูลผู้เบิกสวัสดิการ</p>
            </q-card-section>
            <q-separator />
            <q-card-section class="row wrap q-col-gutter-y-md q-pb-sm font-16 font-bold"
              :class="canCreateFor && !isView ? 'items-center' : ''">
              <div class="col-lg-5 col-12 col-xl-4 row q-gutter-y-md q-pr-sm"
                :class="canCreateFor && !isView ? 'items-center' : ''">
                <p class="col-auto q-mb-none">
                  ชื่อ-นามสกุล : <span v-show="!canCreateFor || isView" class="font-medium font-16 text-grey-7">{{
                    userData?.name ?? "-" }}</span>
                </p>
                <q-select v-if="canCreateFor && !isView" popup-content-class="font-14 font-regular" :loading="isLoading"
                  id="selected-status" class="col-lg q-px-lg-md col-12 font-regular" outlined for="selected-user"
                  v-model="model.createFor" :options="options" dense option-value="id" emit-value map-options
                  option-label="name" @filter="filterFn" use-input input-debounce="100" hide-bottom-space
                  :error="!!isError?.createFor" :rules="[(val) => !!val || '']" @filter-abort="abortFilterFn">
                  <template v-slot:no-option>
                    <q-item>
                      <q-item-section class="text-grey"> ไม่มีตัวเลือก </q-item-section>
                    </q-item>
                  </template>
                </q-select>
              </div>
              <p class="col-lg-3 col-xl-4 col-12 q-mb-none q-pr-sm text-no-wrap ellipsis"
                :title="userData?.position ?? '-'">
                ตำแหน่ง : <span class="font-medium font-16 text-grey-7">{{
                  userData?.position ?? "-" }}</span>
              </p>
              <p class="col-lg col-xl-4 col-12 q-mb-none text-no-wrap ellipsis" :title="userData?.employeeType ?? '-'">
                ประเภทบุคลากร : <span class="font-medium font-16 text-grey-7">{{
                  userData?.employeeType ?? "-" }}</span>
              </p>
              <p class="col-lg-5 col-xl-4 col-12 q-mb-none q-pr-sm">ส่วนงาน : <span
                  class="font-medium font-16 text-grey-7">{{
                    userData?.department ?? "-" }}</span></p>
              <p class="col-lg col-xl-4 col-12 q-mb-none q-pr-sm">ภาควิชา : <span
                  class="font-medium font-16 text-grey-7">{{
                    userData?.sector ?? "-" }}</span>
              </p>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-3 col-12" v-if="!isView">
          <q-card flat bordered class="full-height">
            <q-card-section class="q-px-md font-18 font-bold">
              <p class="q-mb-none">สิทธิ์คงเหลือ</p>
            </q-card-section>
            <q-separator />
            <q-card-section class="row wrap q-col-gutter-y-md font-medium font-16 text-grey-7">
              <p class="col q-ma-none">
                {{ remainingText(remaining , remaining.categoryName) }}
              </p>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <!-- Request Section -->
      <div class="row q-col-gutter-md q-pl-md q-pt-md">
        <div class="col-md-9 col-12">
          <q-card flat bordered class="full-height">
            <q-card-section class="flex justify-between q-px-md q-pt-md q-pb-md font-18 font-bold">
              <p class="q-mb-none">ข้อมูลการเบิกสวัสดิการ</p>
              <a class="q-mb-none font-regular font-16 text-blue-7 cursor-pointer"
                v-if="isView && (model.status == 'รอตรวจสอบ')" @click.stop.prevent="
                  downloadData()">
                <q-icon :name="outlinedDownload" />
                <span> Export</span>
              </a>
            </q-card-section>
            <q-card-section v-show="isView || isEdit" class="row wrap font-medium q-pb-xs font-16 text-grey-9">
              <p class="col-md-4 col-12 q-mb-none">เลขที่ใบเบิก : {{ model.reimNumber ?? "-" }}</p>
              <p class="col-md-4 col-12 q-mb-none">วันที่ร้องขอ : {{ formatDateThaiSlash(model.requestDate) ?? "-" }}
              </p>
              <p class="col-md-4 col-12 q-mb-none">สถานะ : <span :class="textStatusColor(model.status)">{{ model.status ?? "-" }}</span> </p>
            </q-card-section>
            <q-card-section class="row wrap q-col-gutter-x-md font-medium q-pb-xs font-16 text-grey-9">
              <div class="col-12 col-lg">
                <InputGroup for-id="fund-receipt" is-dense v-model="model.fundReceipt" :data="model.fundReceipt ?? '-'"
                  is-require label="จำนวนเงินตามใบเสร็จ (บาท)" placeholder="บาท" type="number" class=""
                  :is-view="isView" :rules="[(val) => !!val || 'กรุณากรอกข้อมูลจำนวนเงินตามใบเสร็จ']"
                  :error-message="isError?.fundReceipt" :error="!!isError?.fundReceipt">
                </InputGroup>
              </div>
              <div class="col-12 col-lg">
                <InputGroup for-id="fund-claim" is-dense v-model="model.fundSumRequest"
                  :data="model.fundSumRequest ?? '-'" is-require label="จำนวนเงินที่ต้องการเบิก (บาท)" placeholder="บาท"
                  type="number" class="q-py-xs-md q-py-lg-none" :is-view="isView" :rules="[
                    (val) => !!val || 'กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก',
                    (val) => !isOver || 'จำนวนเงินที่ต้องการเบิกห้ามมากกว่าจำนวนเงินตามใบเสร็จ',
                    (val) => isOverfundRemaining !== 2 || 'จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้',
                    (val) => isOverfundRemaining !== 1 || 'สามารถเบิกได้สูงสุด ' + (remaining.perTimesRemaining ?? '-') + ' บาทต่อครั้ง',
                    (val) => isOverfundRemaining !== 3 || 'คุณใช้จำนวนการเบิกครบแล้ว'
                  ]" :error-message="isError?.fundSumRequest" :error="!!isError?.fundSumRequest">
                </InputGroup>

              </div>
              <div class="col-12 col-lg">
                <InputGroup label="วัน/เดือน/ปี (ตามใบเสร็จ)" :is-view="isView" clearable
                  :data="model.dateReceipt ?? '-'" is-require>
                  <DatePicker class="col-12" is-dense v-model:model="model.dateReceipt"
                    v-model:dateShow="model.dateReceipt" for-id="date" :no-time="true"
                    :rules="[(val) => !!val || 'กรุณากรอก วัน/เดือน/ปี (ตามใบเสร็จ)']"
                    :error-message="isError?.dateReceipt" :error="!!isError?.dateReceipt" />
                </InputGroup>
              </div>
            </q-card-section>
            <q-card-section class="q-pt-md font-medium font-16">
              <q-table flat bordered :rows="row ?? []" :columns="columns" row-key="index" :wrap-cells="$q.screen.gt.lg"
                table-header-class="font-bold bg-blue-10 text-white" separator="cell" hide-bottom :loading="isLoading">
                <template v-slot:body-cell-index="props">
                  <q-td :props="props">
                    {{ props.rowIndex + 1 }}
                  </q-td>
                </template>
                <template v-slot:no-data="{ icon }">
                  <div class="full-width row flex-center text-negative q-gutter-sm">
                    <q-icon size="2em" :name="icon" />
                    <span class="font-14 font-regular ">
                      ไม่พบข้อมูลประวัติการขอเบิก
                    </span>
                  </div>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-3 col-12">
          <q-card flat bordered class="full-height">
            <q-card-section class="font-18 font-bold">
              <p class="q-mb-none">หลักฐานที่ต้องแนบ</p>
            </q-card-section>
            <q-separator />
            <q-card-section class="row wrap q-col-gutter-y-md font-medium font-16 text-grey-7">
              <div class="col-12">
                <div class="row items-center justify-between q-mb-xs">
                  <span>1. ใบเสร็จรับเงิน</span>
                  <div v-if="!isView">
                    <input ref="fileReceiptInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileReceiptChange" />
                    <q-btn v-if="!fileReceipt.name && !model.fileReceipt" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                      @click="triggerFileReceiptUpload" :loading="fileReceipt.uploading" />
                    <div v-else class="row items-center q-gutter-x-sm">
                      <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFileReceipt"
                        :label="fileReceipt.name || getFileName(model.fileReceipt)" class="q-ma-none" size="sm" />
                      <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileReceipt.file, model.fileReceipt)" title="ดูตัวอย่าง" />
                      <q-btn v-if="model.fileReceipt" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileReceipt)" title="ดาวน์โหลด" />
                    </div>
                  </div>
                  <div v-else-if="isView && model.fileReceipt" class="row items-center q-gutter-x-sm">
                    <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileReceipt)" class="q-ma-none" size="sm" />
                    <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileReceipt)" title="ดูตัวอย่าง" />
                    <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileReceipt)" title="ดาวน์โหลด" />
                  </div>
                  <span v-else-if="isView && !model.fileReceipt" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                </div>
              </div>
              <div class="col-12">
                <div class="row items-center justify-between q-mb-xs">
                  <span>2. ใบรับรองแพทย์</span>
                  <div v-if="!isView">
                    <input ref="fileMedicalInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileMedicalChange" />
                    <q-btn v-if="!fileMedical.name && !model.fileMedicalCertificate" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                      @click="triggerFileMedicalUpload" :loading="fileMedical.uploading" />
                    <div v-else class="row items-center q-gutter-x-sm">
                      <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFileMedical"
                        :label="fileMedical.name || getFileName(model.fileMedicalCertificate)" class="q-ma-none" size="sm" />
                      <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileMedical.file, model.fileMedicalCertificate)" title="ดูตัวอย่าง" />
                      <q-btn v-if="model.fileMedicalCertificate" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileMedicalCertificate)" title="ดาวน์โหลด" />
                    </div>
                  </div>
                  <div v-else-if="isView && model.fileMedicalCertificate" class="row items-center q-gutter-x-sm">
                    <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileMedicalCertificate)" class="q-ma-none" size="sm" />
                    <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileMedicalCertificate)" title="ดูตัวอย่าง" />
                    <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileMedicalCertificate)" title="ดาวน์โหลด" />
                  </div>
                  <span v-else-if="isView && !model.fileMedicalCertificate" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                </div>
              </div>
              <div class="col-12">
                <div class="row items-center justify-between q-mb-xs">
                  <span class="col-8">3. คำสั่งประโยชน์ทดแทนหรือใบยืนยันการใช้สิทธิประโยชน์ทดแทน (จากเว็บประกันสังคม) (สถานะ อนุมัติ)</span>
                  <div v-if="!isView" class="col-4 text-right">
                    <input ref="fileSocialInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileSocialChange" />
                    <q-btn v-if="!fileSocial.name && !model.fileSocialSecurity" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                      @click="triggerFileSocialUpload" :loading="fileSocial.uploading" />
                    <div v-else class="row items-center q-gutter-x-sm justify-end">
                      <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFileSocial"
                        :label="fileSocial.name || getFileName(model.fileSocialSecurity)" class="q-ma-none" size="sm" />
                      <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileSocial.file, model.fileSocialSecurity)" title="ดูตัวอย่าง" />
                      <q-btn v-if="model.fileSocialSecurity" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileSocialSecurity)" title="ดาวน์โหลด" />
                    </div>
                  </div>
                  <div v-else-if="isView && model.fileSocialSecurity" class="row items-center q-gutter-x-sm">
                    <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileSocialSecurity)" class="q-ma-none" size="sm" />
                    <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileSocialSecurity)" title="ดูตัวอย่าง" />
                    <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileSocialSecurity)" title="ดาวน์โหลด" />
                  </div>
                  <span v-else-if="isView && !model.fileSocialSecurity" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
    <!--Action Slot -->
    <template v-slot:action>
      <div class="justify-end row q-py-xs font-medium q-gutter-lg">
        <q-btn id="button-back" class="text-white font-medium font-16 weight-8 q-px-lg" dense type="button"
          style="background : #BFBFBF;" label="ย้อนกลับ" no-caps :to="{ name: 'dental_care_welfare_list' }" />
        <q-btn :disable="isValidate" id="button-draft"
          class="text-white font-medium bg-blue-9 text-white font-16 weight-8 q-px-lg" dense type="submit"
          label="บันทึกฉบับร่าง" no-caps @click="submit(1)" v-if="!isView && !isLoading" />
        <q-btn :disable="!canRequest || isValidate" id="button-approve"
          class="font-medium font-16 weight-8 text-white q-px-md" dense type="submit" style="background-color: #43a047"
          label="ส่งคำร้องขอ" no-caps @click="submit(2)" v-if="!isView && !isLoading" />
      </div>
    </template>
  </PageLayout>
  <q-dialog v-model="previewDialog.show" maximized>
    <q-card class="bg-grey-9">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6 text-white">{{ previewDialog.fileName }}</div>
        <q-space />
        <q-btn icon="download" flat round dense color="white" @click="downloadFile(previewDialog.serverFileName)" v-if="previewDialog.serverFileName" />
        <q-btn icon="close" flat round dense color="white" v-close-popup />
      </q-card-section>
      <q-card-section class="flex flex-center" style="height: calc(100vh - 80px);">
        <img v-if="previewDialog.type === 'image'" :src="previewDialog.url" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        <iframe v-else-if="previewDialog.type === 'pdf'" :src="previewDialog.url" style="width: 100%; height: 100%; border: none;" />
        <div v-else class="text-white text-center">
          <q-icon name="description" size="100px" />
          <p class="q-mt-md">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
          <q-btn color="primary" label="ดาวน์โหลด" @click="downloadFile(previewDialog.serverFileName)" v-if="previewDialog.serverFileName" />
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
<style scoped>
.q-table--bordered {
  border-radius: 0;
}
</style>
<script setup>
import PageLayout from "src/layouts/PageLayout.vue";
import InputGroup from "src/components/InputGroup.vue";
import DatePicker from "src/components/DatePicker.vue";
import Swal from "sweetalert2";
import { Notify } from "quasar";

import { formatDateThaiSlash, formatNumber, formatDateSlash, formatDateServer } from "src/components/format";
import { outlinedDownload } from "@quasar/extras/material-icons-outlined";
import dentalWelfareService from "src/boot/service/dentalWelfareService";
import userManagementService from "src/boot/service/userManagementService";
import exportService from "src/boot/service/exportService";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "src/stores/authStore";
import { textStatusColor } from "src/components/status";
import { remainingText } from "src/components/remaining";

defineOptions({
  name: "DentalCareWelfareEdit",
});
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const model = ref({
  createFor: null,
  dateReceipt: null,
  fundReceipt: null,
  fundSumRequest: null,
  fileReceipt: null,
  fileMedicalCertificate: null,
  fileSocialSecurity: null,
});
const isError = ref({});
const userInitialData = ref([]);
const userData = ref({});
const remaining = ref({});
let options = ref([]);
const isLoading = ref(false);
const canRequest = ref(false);
const isView = ref(false);
const fileReceiptInput = ref(null);
const fileMedicalInput = ref(null);
const fileSocialInput = ref(null);
const fileReceipt = ref({ file: null, name: null, uploading: false });
const fileMedical = ref({ file: null, name: null, uploading: false });
const fileSocial = ref({ file: null, name: null, uploading: false });
const previewDialog = ref({ show: false, url: null, type: null, fileName: null, serverFileName: null });
const fileReceiptPreviewUrl = ref(null);
const fileMedicalPreviewUrl = ref(null);

const isEdit = computed(() => {
  return !isNaN(route.params.id);
});
const isFetchRemaining = ref(false);
const isValidate = computed(() => {
  let validate = false;
  if (!model.value.fundReceipt) {
    validate = true;
  }
  if (!model.value.dateReceipt) {
    validate = true;
  }
  if (!model.value.fundSumRequest) {
    validate = true;
  }
  if (isOverfundRemaining.value) {
    validate = true;
  }
  if (!model.value.createFor && canCreateFor.value) {
    validate = true;
  }
  if (isOver.value) {
    validate = true;
  }
  return validate;
});

const isOver = computed(() => {
  return Number(model.value.fundSumRequest) > Number(model.value.fundReceipt);
});

const isOverfundRemaining = computed(() => {

  const fundSumRequest = Number(model.value.fundSumRequest ?? 0);

  const perTimes = remaining.value.perTimesRemaining ? parseFloat(remaining.value.perTimesRemaining.replace(/,/g, "")) : null;
  const fundRemaining = remaining.value.fundRemaining ? parseFloat(remaining.value.fundRemaining.replace(/,/g, "")) : null;
  let check = false;
  if (fundSumRequest > fundRemaining && remaining.value.fundRemaining) {
    check = 2;
  }
  else if (fundSumRequest > perTimes && remaining.value.perTimesRemaining) {
    check = 1;
  }
  if (!canRequest.value && isFetchRemaining.value) {
    check = 3;
  }
  return check;
});

const canCreateFor = computed(() => {
  return authStore.isEditor;
});
onMounted(async () => {
  await init();
  isLoading.value = false;
});

onBeforeUnmount(() => {
  model.value = null;
});
watch(
  model,
  () => {
    if (!isView.value) {
      Object.keys(model.value).forEach((key) => {
        if (model.value[key] !== null) {
          delete isError.value[key];
        }
      });
    }
  },
  { deep: true }
);
watch(
  () => model.value.createFor,
  (newValue) => {
    try {
      if (canCreateFor.value) {
        if ((newValue !== null && newValue !== undefined) && !isView.value) {
          fetchRemaining();
          fetchUserData(newValue);
        }
      }
    }
    catch (error) {
      Notify.create({
        message:
          error?.response?.data?.message ??
          "ไม่พบข้อมูลสิทธิ์คงเหลือของผู้ใช้งาน",
        position: "bottom-left",
        type: "negative",
      });
    }
  }
);

async function fetchDataEdit() {
  setTimeout(async () => {
    try {
      const result = await dentalWelfareService.dataById(route.params.id);
      var returnedData = result.data.datas;
      if (returnedData) {
        model.value = {
          createFor: returnedData?.user.userId,
          reimNumber: returnedData?.reimNumber,
          requestDate: returnedData?.requestDate,
          status: returnedData?.status,
          fundReceipt: returnedData?.fundReceipt,
          fundSumRequest: returnedData?.fundSumRequest,
          dateReceipt: isView.value === true ? formatDateThaiSlash(returnedData?.dateReceipt) : formatDateSlash(returnedData?.dateReceipt),
          fileReceipt: returnedData?.fileReceipt,
          fileMedicalCertificate: returnedData?.fileMedicalCertificate,
          fileSocialSecurity: returnedData?.fileSocialSecurity,
        };
        if (isView.value) {
          if (returnedData?.fileReceipt) loadInlinePreview(returnedData.fileReceipt, 'receipt');
          if (returnedData?.fileMedicalCertificate) loadInlinePreview(returnedData.fileMedicalCertificate, 'medical');
        }
        userData.value = {
          name: returnedData?.user.name,
          position: returnedData?.user.position,
          employeeType: returnedData?.user.employeeType,
          sector: returnedData?.user.sector,
          department: returnedData?.user.department,
        };
        if (Array.isArray(returnedData?.requestData) && returnedData.requestData.length > 0) {
          row.value = returnedData?.requestData ?? [
            {
              id: 1,
              dateReceipt: null,
              fundSumRequest: null,
            },
            {
              id: 2,
              dateReceipt: null,
              fundSumRequest: null,
            },
            {
              id: 3,
              dateReceipt: null,
              fundSumRequest: null,
            },
          ];
        }
        else {
          row.value = [
            {
              id: 1,
              dateReceipt: null,
              fundSumRequest: null,
            },
            {
              id: 2,
              dateReceipt: null,
              fundSumRequest: null,
            },
            {
              id: 3,
              dateReceipt: null,
              fundSumRequest: null,
            },
          ]
        }
      }
    } catch (error) {
      router.replace({ name: "dental_care_welfare_list" });
      Notify.create({
        message:
          error?.response?.data?.message ??
          "เกิดข้อผิดพลาดกรุณาลองอีกครั้ง",
        position: "bottom-left",
        type: "negative",
      });
    }
    isLoading.value = false;
  }, 100);
}
async function fetchUserData(id) {
  try {
    const result = await userManagementService.dataById(id);
    var returnedData = result.data.datas;
    if (returnedData) {
      userData.value = {
        name: returnedData?.name,
        position: returnedData?.position.name,
        employeeType: returnedData?.employeeType.name,
        sector: returnedData?.sector.name,
        department: returnedData?.department.name,
      };
    }
  }
  catch (error) {
    Promise.reject(error);
  }
}
async function fetchRemaining() {
  try {
    const fetchRemaining = await dentalWelfareService.getRemaining({ createFor: model.value.createFor });
    if (fetchRemaining.data?.datas?.requestsRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.requestsRemaining))) {
      remaining.value.requestsRemaining = formatNumber(fetchRemaining.data?.datas?.requestsRemaining);
    }
    if (fetchRemaining.data?.datas?.fundRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.fundRemaining))) {
      remaining.value.fundRemaining = formatNumber(fetchRemaining.data?.datas?.fundRemaining);
    }
    if (fetchRemaining.data?.datas?.perTimesRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.perTimesRemaining))) {
      remaining.value.perTimesRemaining = formatNumber(fetchRemaining.data?.datas?.perTimesRemaining);
    }
    if (fetchRemaining.data?.datas?.perUsersRemaining != null && !isNaN(Number(fetchRemaining.data?.datas?.perUsersRemaining))) {
      remaining.value.perUsersRemaining = formatNumber(fetchRemaining.data?.datas?.perUsersRemaining);
    }
    if (fetchRemaining.data?.datas?.categoryName != null) {
      remaining.value.categoryName = fetchRemaining.data?.datas?.categoryName;
    }
    canRequest.value = fetchRemaining.data?.canRequest;
    if (Array.isArray(fetchRemaining.data?.requestData) && fetchRemaining.data?.requestData.length > 0) {
      row.value = fetchRemaining.data?.requestData ?? [
        {
          id: 1,
          dateReceipt: null,
          fundSumRequest: null,
        },
        {
          id: 2,
          dateReceipt: null,
          fundSumRequest: null,
        },
        {
          id: 3,
          dateReceipt: null,
          fundSumRequest: null,
        },
      ];
    }
    else {
      row.value = [
        {
          id: 1,
          dateReceipt: null,
          fundSumRequest: null,
        },
        {
          id: 2,
          dateReceipt: null,
          fundSumRequest: null,
        },
        {
          id: 3,
          dateReceipt: null,
          fundSumRequest: null,
        },
      ]
    }
    isFetchRemaining.value = true;
  } catch (error) {
    Promise.reject(error);
  }
}
async function downloadData() {
  const notify = Notify.create({
    message: "กรุณารอสักครู่ ระบบกำลังทำการดาวน์โหลด",
    position: "top-right",
    spinner: true,
    type: 'info',
  });
  try {
    const result = await exportService.dental(route.params.id);
    let filename = null;
    const contentDisposition = result.headers["content-disposition"];
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename="?([^"]+)"?/);
      if (matches && matches[1]) {
        filename = decodeURIComponent(matches[1]);
      }
    }

    const blob = new Blob([result.data], { type: "application/pdf" });

    const a = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
  catch (error) {
    console.log(error);
    Notify.create({
      message:
        error?.response?.data?.message ??
        "ดาวน์โหลดไม่สำเร็จกรุณาลองอีกครั้ง",
      position: "top-right",
      type: "primary",
    });
  }
  finally {
    notify();
  }
}
async function filterFn(val, update) {
  try {
    setTimeout(async () => {
      update(() => {
        if (val === '') {
          options.value = userInitialData.value;
        }
        else {
          options.value = userInitialData.value.filter(v => v.name.includes(val));
        }
      });
    }, 650);

  }
  catch (error) {
    Promise.reject(error);
  }
}
function abortFilterFn() {
  // console.log('delayed filter aborted')
}
function getFileName(filename) {
  if (!filename) return '';
  return filename.replace(/^\d+-/, '');
}
function getFileType(filename) {
  if (!filename) return 'unknown';
  const ext = filename.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'unknown';
}
function isImageFile(filename) {
  return getFileType(filename) === 'image';
}
async function loadInlinePreview(filename, type) {
  if (!filename || !isImageFile(filename)) return;
  try {
    const result = await dentalWelfareService.getFileByName(filename);
    const ext = filename.split('.').pop().toLowerCase();
    let mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const blob = new Blob([result.data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    if (type === 'receipt') fileReceiptPreviewUrl.value = url;
    else fileMedicalPreviewUrl.value = url;
  } catch (error) {
    console.error('Error loading preview:', error);
  }
}
async function previewFile(localFile, serverFileName) {
  if (localFile) {
    const fileType = getFileType(localFile.name);
    previewDialog.value = { show: true, url: URL.createObjectURL(localFile), type: fileType, fileName: localFile.name, serverFileName: null };
    return;
  }
  if (serverFileName) {
    const notify = Notify.create({ message: 'กำลังโหลดไฟล์...', position: 'top-right', spinner: true, type: 'info' });
    try {
      const result = await dentalWelfareService.getFileByName(serverFileName);
      const fileType = getFileType(serverFileName);
      let mimeType = 'application/octet-stream';
      if (fileType === 'image') {
        const ext = serverFileName.split('.').pop().toLowerCase();
        mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      } else if (fileType === 'pdf') mimeType = 'application/pdf';
      const blob = new Blob([result.data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      previewDialog.value = { show: true, url, type: fileType, fileName: getFileName(serverFileName), serverFileName };
    } catch (error) {
      Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการโหลดไฟล์', position: 'top-right', type: 'negative' });
    } finally {
      notify();
    }
  }
}
function triggerFileReceiptUpload() {
  fileReceiptInput.value?.click();
}
function triggerFileMedicalUpload() {
  fileMedicalInput.value?.click();
}
function triggerFileSocialUpload() {
  fileSocialInput.value?.click();
}
async function handleFileReceiptChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  fileReceipt.value.file = file;
  fileReceipt.value.name = file.name;
  if (isEdit.value && route.params.id) {
    await uploadFileToServer('receipt', file);
  } else {
    Notify.create({ message: 'เลือกไฟล์สำเร็จ จะอัปโหลดหลังจากบันทึกข้อมูล', position: 'bottom-left', type: 'info' });
  }
}
async function handleFileMedicalChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  fileMedical.value.file = file;
  fileMedical.value.name = file.name;
  if (isEdit.value && route.params.id) {
    await uploadFileToServer('medical', file);
  } else {
    Notify.create({ message: 'เลือกไฟล์สำเร็จ จะอัปโหลดหลังจากบันทึกข้อมูล', position: 'bottom-left', type: 'info' });
  }
}
async function handleFileSocialChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  fileSocial.value.file = file;
  fileSocial.value.name = file.name;
  if (isEdit.value && route.params.id) {
    await uploadFileToServer('social', file);
  } else {
    Notify.create({ message: 'เลือกไฟล์สำเร็จ จะอัปโหลดหลังจากบันทึกข้อมูล', position: 'bottom-left', type: 'info' });
  }
}
async function uploadFileToServer(type, file) {
  const formData = new FormData();
  if (type === 'receipt') {
    fileReceipt.value.uploading = true;
    formData.append('fileReceipt', file);
  } else if (type === 'medical') {
    fileMedical.value.uploading = true;
    formData.append('fileMedicalCertificate', file);
  } else {
    fileSocial.value.uploading = true;
    formData.append('fileSocialSecurity', file);
  }
  try {
    const result = await dentalWelfareService.uploadFile(route.params.id, formData);
    if (result.data.files) {
      if (result.data.files.fileReceipt) model.value.fileReceipt = result.data.files.fileReceipt;
      if (result.data.files.fileMedicalCertificate) model.value.fileMedicalCertificate = result.data.files.fileMedicalCertificate;
      if (result.data.files.fileSocialSecurity) model.value.fileSocialSecurity = result.data.files.fileSocialSecurity;
    }
    Notify.create({ message: 'อัปโหลดไฟล์สำเร็จ', position: 'bottom-left', type: 'positive' });
  } catch (error) {
    Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์', position: 'bottom-left', type: 'negative' });
    if (type === 'receipt') { fileReceipt.value.file = null; fileReceipt.value.name = null; }
    else if (type === 'medical') { fileMedical.value.file = null; fileMedical.value.name = null; }
    else { fileSocial.value.file = null; fileSocial.value.name = null; }
  } finally {
    if (type === 'receipt') fileReceipt.value.uploading = false;
    else if (type === 'medical') fileMedical.value.uploading = false;
    else fileSocial.value.uploading = false;
  }
}
async function removeFileReceipt() {
  if (model.value.fileReceipt && isEdit.value && route.params.id) {
    try {
      await dentalWelfareService.deleteFile(route.params.id, 'receipt');
      model.value.fileReceipt = null;
      Notify.create({ message: 'ลบไฟล์สำเร็จ', position: 'bottom-left', type: 'positive' });
    } catch (error) {
      Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบไฟล์', position: 'bottom-left', type: 'negative' });
      return;
    }
  }
  fileReceipt.value.file = null;
  fileReceipt.value.name = null;
  if (fileReceiptInput.value) fileReceiptInput.value.value = '';
}
async function removeFileMedical() {
  if (model.value.fileMedicalCertificate && isEdit.value && route.params.id) {
    try {
      await dentalWelfareService.deleteFile(route.params.id, 'medical_certificate');
      model.value.fileMedicalCertificate = null;
      Notify.create({ message: 'ลบไฟล์สำเร็จ', position: 'bottom-left', type: 'positive' });
    } catch (error) {
      Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบไฟล์', position: 'bottom-left', type: 'negative' });
      return;
    }
  }
  fileMedical.value.file = null;
  fileMedical.value.name = null;
  if (fileMedicalInput.value) fileMedicalInput.value.value = '';
}
async function removeFileSocial() {
  if (model.value.fileSocialSecurity && isEdit.value && route.params.id) {
    try {
      await dentalWelfareService.deleteFile(route.params.id, 'social_security');
      model.value.fileSocialSecurity = null;
      Notify.create({ message: 'ลบไฟล์สำเร็จ', position: 'bottom-left', type: 'positive' });
    } catch (error) {
      Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบไฟล์', position: 'bottom-left', type: 'negative' });
      return;
    }
  }
  fileSocial.value.file = null;
  fileSocial.value.name = null;
  if (fileSocialInput.value) fileSocialInput.value.value = '';
}
async function downloadFile(fileName) {
  if (!fileName) return;
  const notify = Notify.create({ message: 'กำลังดาวน์โหลด...', position: 'top-right', spinner: true, type: 'info' });
  try {
    const result = await dentalWelfareService.getFileByName(fileName);
    const contentDisposition = result.headers['content-disposition'];
    let downloadFileName = getFileName(fileName);
    if (contentDisposition) {
      const matches = contentDisposition.match(/filename\*=UTF-8''(.+)/);
      if (matches?.[1]) downloadFileName = decodeURIComponent(matches[1]);
    }
    const ext = fileName.split('.').pop().toLowerCase();
    let mimeType = 'application/octet-stream';
    if (ext === 'pdf') mimeType = 'application/pdf';
    else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';
    const blob = new Blob([result.data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์', position: 'top-right', type: 'negative' });
  } finally {
    notify();
  }
}

async function submit(actionId) {
  let validate = false;
  if (!model.value.fundReceipt) {
    isError.value.fundReceipt = "กรุณากรอกข้อมูลจำนวนเงินตามใบเสร็จ";
    let navigate = document.getElementById("fund-receipt");
    window.location.hash = "fund-receipt";
    navigate.scrollIntoView(false);
    validate = true;
  }
  if (!model.value.dateReceipt) {
    isError.value.dateReceipt = "กรุณากรอก วัน/เดือน/ปี (ตามใบเสร็จ)";
    let navigate = document.getElementById("fund-receipt");
    window.location.hash = "fund-receipt";
    navigate.scrollIntoView(false);
    validate = true;
  }
  if (!model.value.fundSumRequest) {
    isError.value.fundSumRequest = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก";
    let navigate = document.getElementById("fund-receipt");
    window.location.hash = "fund-receipt";
    navigate.scrollIntoView(false);
    validate = true;
  }
  if (!model.value.createFor && canCreateFor.value) {
    isError.value.createFor = "โปรดเลือกผู้ใช้งาน";
    let navigate = document.getElementById("fund-receipt");
    window.location.hash = "fund-receipt";
    navigate.scrollIntoView(false);
    validate = true;
  }
  if (isOverfundRemaining.value) {
    if (isOverfundRemaining.value === 2) {
      isError.value.fundEligible = "จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้";
    }
    else if(isOverfundRemaining.value === 1) {
      isError.value.fundEligible = "สามารถเบิกได้สูงสุด " + remaining.value.perTimesRemaining + " บาทต่อครั้ง";
    }
    else{
      isError.value.fundEligible = "คุณใช้จำนวนการเบิกครบแล้ว";
    }
    validate = true;
  }
  if (isOver.value) {
    isError.value.fundSumRequest = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิกให้น้อยกว่าหรือเท่ากับจำนวนเงินตามใบเสร็จ";
    validate = true;
  }
  if (validate === true) {
    Notify.create({
      message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      position: "bottom-left",
      type: "negative",
    });
    return;
  }
  let isValid = false;
  let payload = {
    fundReceipt: model.value.fundReceipt,
    dateReceipt: formatDateServer(model.value.dateReceipt),
    fundSumRequest: model.value.fundSumRequest,
    createFor: canCreateFor.value ? model.value.createFor : null,
    actionId: actionId
  }
  var fetch;
  Swal.fire({
    title: "ยืนยันการทำรายการหรือไม่ ???",
    html: `โปรดตรวจสอบข้อมูลให้แน่ใจก่อนยืนยัน`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "ยืนยัน",
    cancelButtonText: "ยกเลิก",
    showLoaderOnConfirm: true,
    reverseButtons: true,
    customClass: {
      confirmButton: "save-button",
      cancelButton: "cancel-button",
    },
    preConfirm: async () => {
      try {
        if (isEdit.value) {
          fetch = await dentalWelfareService.update(route.params.id, payload);
        }
        else {
          fetch = await dentalWelfareService.create(payload);
        }
        isValid = true;
      } catch (error) {
        if (error?.response?.status == 400) {
          if (Object.keys(error?.response?.data?.errors ?? {}).length) {
            isError.value = {
              ...isError.value,
              ...error.response?.data?.errors,
            };
          }
        }
        Swal.fire({
          html: error?.response?.data?.message ?? `เกิดข้อผิดพลาดกรุณาลองอีกครั้ง`,
          icon: "error",
          confirmButtonText: "ตกลง",
          customClass: {
            confirmButton: "save-button",
          },
        });
      }
    },
  }).then(async (result) => {
    if (isValid && result.isConfirmed) {
      const newRecordId = fetch.data?.newItem?.id || fetch.data?.updatedItem?.id || route.params.id;
      if (newRecordId && (fileReceipt.value.file || fileMedical.value.file || fileSocial.value.file)) {
        try {
          const formData = new FormData();
          if (fileReceipt.value.file) formData.append('fileReceipt', fileReceipt.value.file);
          if (fileMedical.value.file) formData.append('fileMedicalCertificate', fileMedical.value.file);
          if (fileSocial.value.file) formData.append('fileSocialSecurity', fileSocial.value.file);
          await dentalWelfareService.uploadFile(newRecordId, formData);
        } catch (error) {
          console.error('File upload error:', error);
        }
      }
      Swal.fire({
        html: fetch.data?.message ?? `สำเร็จ`,
        icon: "success",
        confirmButtonText: "ตกลง",
        customClass: {
          confirmButton: "save-button",
        },
      }).then(() => {
        router.replace({ name: "dental_care_welfare_list" });
      });
    }
  });
}

const row = ref([
  {
    id: 1,
    dateReceipt: null,
    fundSumRequest: null,
  },
  {
    id: 2,
    dateReceipt: null,
    fundSumRequest: null,
  },
  {
    id: 3,
    dateReceipt: null,
    fundSumRequest: null,
  },
]);
const columns = ref([
  {
    name: "index",
    label: "เบิกครั้งที่",
    align: "center",
    field: "index",
    classes: "ellipsis",
  },
  {
    name: "dateReceipt",
    label: "วัน/เดือน/ปี",
    align: "left",
    field: (row) => row.dateReceipt ?? "-",
    format: (val) => formatDateThaiSlash(val),
    classes: "ellipsis",
  },
  {
    name: "fundSumRequest",
    label: "จำนวนเงิน",
    align: "right",
    field: (row) => row.fundSumRequest ?? "-",
    format: (val) => {
      const number = Number(val); // Convert to number
      if (!isNaN(number)) {
        return number.toLocaleString("en-US", {
          minimumFractionDigits: number % 1 === 0 ? 0 : 2, // No decimals for whole numbers, 2 decimals otherwise
          maximumFractionDigits: 2, // Limit to 2 decimal places
        }); // Format as '3,000'
      }
      return `${val}`; // If conversion fails, return a fallback value
    },
    classes: "ellipsis",
  },
]);
async function init() {
  isView.value = route.meta.isView;
  isLoading.value = true;
  try {
    if (isView.value) {
      fetchDataEdit();
    }
    else if (isEdit.value) {
      if (!canCreateFor.value) {
        fetchRemaining();
      }
      const result = await userManagementService.getUserInitialData({ keyword: null });
      userInitialData.value = result.data.datas;
      options.value = result.data.datas;
      fetchDataEdit();
    }
    else {
      if (!canCreateFor.value) {
        fetchRemaining();
        fetchUserData(authStore.id);
      }
      else {
        const result = await userManagementService.getUserInitialData({ keyword: null });
        userInitialData.value = result.data.datas;
      }
    }
  }
  catch (error) {
    Promise.reject(error);
  }
  isLoading.value = false;
}
</script>
