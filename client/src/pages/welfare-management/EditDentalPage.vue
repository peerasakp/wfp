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
            <q-card-section class="row wrap q-col-gutter-y-md q-pb-sm font-16 font-bold">
              <div class="col-lg-5 col-12 col-xl-4 row q-gutter-y-md q-pr-sm">
                <p class="col-auto q-mb-none">
                  ชื่อ-นามสกุล : <span class="font-medium font-16 text-grey-7">{{
                    userData?.name ?? "-" }}</span>
                </p>
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
                v-if="(isView || authStore.roleId === 5) && ['รอตรวจสอบ', 'รออนุมัติ', 'รอจ่ายเงิน', 'อนุมัติ'].includes(model.status)" @click.stop.prevent="
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
                <p class="q-mb-xs">1. ใบเสร็จรับเงิน</p>
                <div v-if="model.fileReceipt" class="row items-center q-gutter-sm q-mb-sm">
                  <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileReceipt)" size="sm" />
                  <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(model.fileReceipt)" title="ดูตัวอย่าง" />
                  <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileReceipt)" title="ดาวน์โหลด" />
                </div>
                <p v-else class="text-grey-5 font-14 q-mb-none">ไม่มีไฟล์แนบ</p>
              </div>
              <div class="col-12">
                <p class="q-mb-xs">2. ใบรับรองแพทย์</p>
                <div v-if="model.fileMedicalCertificate" class="row items-center q-gutter-sm q-mb-sm">
                  <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileMedicalCertificate)" size="sm" />
                  <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(model.fileMedicalCertificate)" title="ดูตัวอย่าง" />
                  <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileMedicalCertificate)" title="ดาวน์โหลด" />
                </div>
                <p v-else class="text-grey-5 font-14 q-mb-none">ไม่มีไฟล์แนบ</p>
              </div>
              <div class="col-12">
                <p class="q-mb-xs">3. คำสั่งประโยชน์ทดแทนหรือใบยืนยันการใช้สิทธิประโยชน์ทดแทน (จากเว็บประกันสังคม) (สถานะ อนุมัติ)</p>
                <div v-if="model.fileSocialSecurity" class="row items-center q-gutter-sm q-mb-sm">
                  <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileSocialSecurity)" size="sm" />
                  <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(model.fileSocialSecurity)" title="ดูตัวอย่าง" />
                  <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileSocialSecurity)" title="ดาวน์โหลด" />
                </div>
                <p v-else class="text-grey-5 font-14 q-mb-none">ไม่มีไฟล์แนบ</p>
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
          style="background : #BFBFBF;" label="ย้อนกลับ" no-caps :to="{ name: 'welfare_management_list' }" />
        <q-btn :disable="isValidate" id="button-draft"
          class="text-white font-medium bg-blue-9 text-white font-16 weight-8 q-px-lg" dense type="submit"
          label="บันทึก" no-caps @click="submit()" v-if="!isView && !isLoading && !isFinancialPendingFinal && !isFinancialActionOnly" />
        <q-btn id="button-approve"
        class="font-medium font-16 weight-8 text-white q-px-md" dense type="submit" style="background-color: #E52020"
        label="ไม่อนุมัติ" no-caps @click="submit(4)" v-if="!isView && !isLoading && !isFinancialPendingFinal" />
        <q-btn :disable="isFinancialWaitPayment ? false : (!canRequest || isValidate)" id="button-approve"
          class="font-medium font-16 weight-8 text-white q-px-md" dense type="submit" style="background-color: #43a047"
          label="อนุมัติ" no-caps @click="submit(3)" v-if="!isView && !isLoading && !isFinancialPendingFinal" />
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
import welfareManagementService from "src/boot/service/welfareManagementService";

defineOptions({
  name: "DentalCareWelfareEdit",
});
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const isFinancialPendingFinal = computed(
  () => authStore.roleId === 2 && model.value.status === "รออนุมัติ"
);
const isFinancialActionOnly = computed(
  () => authStore.roleId === 2
);
const isFinancialWaitPayment = computed(
  () => authStore.roleId === 2 && model.value.status === "รอจ่ายเงิน"
);
const model = ref({
  createFor: null,
  dateReceipt: null,
  fundReceipt: null,
  fundSumRequest: null,
  fileReceipt: null,
  fileMedicalCertificate: null,
  fileSocialSecurity: null,
});
const previewDialog = ref({ show: false, url: null, type: null, fileName: null, serverFileName: null });
const isError = ref({});
const userInitialData = ref([]);
const userData = ref({});
const remaining = ref({});
let options = ref([]);
const isLoading = ref(false);
const canRequest = ref(false);
const isView = ref(false);
const isFetchRemaining = ref(false);
const isEdit = computed(() => {
  return !isNaN(route.params.id);
});
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
  if (!model.value.createFor) {
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

onMounted(async () => {
  await init();
  isLoading.value = false;
});

onBeforeUnmount(() => {
  isLoading.value = false;
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
  async (newValue) => {
    if (newValue !== null) {
      await fetchRemaining();
    }
  }
);
async function fetchDataEdit() {
  setTimeout(async () => {
    try {
      const result = await welfareManagementService.dataDentalById(route.params.id);
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
      router.replace({ name: "welfare_management_list" });
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
  if (validate === true && actionId != 4) {
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
          fetch = await welfareManagementService.updateDental(route.params.id, {
            ...payload,
            isFinalApprove: authStore.roleId === 5,
            isDisburseApprove: authStore.roleId === 2 && model.value.status === "รอจ่ายเงิน",
          });
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
  }).then((result) => {
    if (isValid && result.isConfirmed) {
      Swal.fire({
        html: fetch.data?.message ?? `สำเร็จ`,
        icon: "success",
        confirmButtonText: "ตกลง",
        customClass: {
          confirmButton: "save-button",
        },
      }).then(() => {
        router.replace({ name: "welfare_management_list" });
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
      fetchRemaining();
      const result = await userManagementService.getUserInitialData({ keyword: null });
      userInitialData.value = result.data.datas;
      options.value = result.data.datas;
      fetchDataEdit();
    }
    else {
      fetchRemaining();
      fetchUserData(authStore.id);
      const result = await userManagementService.getUserInitialData({ keyword: null });
      userInitialData.value = result.data.datas;
    }
  }
  catch (error) {
    Promise.reject(error);
  }
  isLoading.value = false;
}

// File handling functions
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
async function previewFile(serverFileName) {
  if (!serverFileName) return;
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
    else if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg';
    else if (ext === 'png') mimeType = 'image/png';
    const blob = new Blob([result.data], { type: mimeType });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    Notify.create({ message: 'ดาวน์โหลดสำเร็จ', position: 'top-right', type: 'positive' });
  } catch (error) {
    Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการดาวน์โหลด', position: 'top-right', type: 'negative' });
  } finally {
    notify();
  }
}
</script>
