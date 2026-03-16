<template>
  <PageLayout title="เบิกสวัสดิการทั่วไป (ค่าตรวจสุขภาพ)">
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
                {{ remainingText(remaining, remaining.categoryName) }}
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
              <p class="col-md-4 col-12 q-mb-none">สถานะ : <span :class="textStatusColor(model.status)">{{ model.status
                ?? "-"
                  }}</span> </p>
            </q-card-section>
            <q-card-section class="row wrap font-medium q-pb-xs font-16 text-grey-9">
              <InputGroup for-id="fund" is-dense v-model="model.fundReceipt" :data="model.fundReceipt ?? '-'" is-require
                label="จำนวนเงินตามใบเสร็จ (บาท)" placeholder="บาท" type="number" compclass="col-md-4 col-12" :rules="[
                  (val) => !!val || 'กรุณากรอกข้อมูลจำนวนเงินตามใบเสร็จ',
                  (val) => !isOver || 'จำนวนเงินตามใบเสร็จต้องมากกว่าเงินที่ได้รับจากสิทธิอื่น ๆ',
                ]" :is-view="isView" :error-message="isError?.fundReceipt" :error="!!isError?.fundReceipt">
              </InputGroup>

              <InputGroup for-id="fund" is-dense :data="model.fundSumRequest ?? '-'" is-require
                label="จำนวนที่ต้องการเบิก (บาท)" type="number" compclass="col-md-4 col-12" :is-view="isView"
                v-if="isView">
              </InputGroup>
            </q-card-section>
            <q-card-section class="q-pt-sm font-medium font-16">
              <q-table flat bordered :rows="row ?? []" :columns="columns" row-key="id" :wrap-cells="$q.screen.gt.lg"
                table-header-class="font-bold bg-blue-10 text-white" separator="cell" hide-bottom :loading="isLoading">
                <template v-slot:loading>
                  <q-inner-loading showing color="primary" />
                </template>
                <template v-slot:body-cell-fundEligibleName="props">
                  <q-td v-if="!props.row.isInput || isView" :props="props" class="text-center text-grey-9">
                    {{ props.row.fundEligibleName ?? "-" }}
                  </q-td>
                  <q-td v-else :props="props" class="text-grey-9">
                    <q-input class="font-14 font-regular" dense
                      v-model="model.claimByEligible[props.row.id - 1].fundEligibleName" outlined autocomplete="off"
                      hide-bottom-space :bottom-slots="false" color="dark" type="text"
                      :for="'input-fundEligibleName' + props.row.id" placeholder="">
                    </q-input>
                  </q-td>
                </template>
                <template v-slot:body-cell-fundEligible="props">
                  <q-td v-if="isView" :props="props" class="text-center text-grey-9">
                    {{ props.row.fundEligible ?? 0 }}
                  </q-td>
                  <q-td v-else :props="props" class="text-grey-9">
                    <q-input class="font-14 font-regular" dense
                      v-model="model.claimByEligible[props.row.id - 1].fundEligible" outlined autocomplete="off"
                      hide-bottom-space color="dark" type="number" :error="!!isErrorFundSum && props.row.id === 2" :error-message="props.row.id === 2 ? isErrorFundSum : ''" :forId="'input-fundEligible' + props.row.id"
                      placeholder="0" :rules="[
                        (val) => (props.row.id === 2 && !val ? 'กรุณากรอกข้อมูลที่ต้องการเบิก' : true),
                      ]">
                    </q-input>
                  </q-td>
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
              <!-- Receipt File -->
              <div class="col-12">
                <p class="q-mb-sm">1. ใบเสร็จรับเงิน</p>
                <div v-if="model.fileReceipt" class="q-ml-md">
                  <q-chip
                    color="blue-1"
                    text-color="blue-9"
                    icon="description"
                    class="q-mb-xs"
                  >
                    {{ getFileName(model.fileReceipt) }}
                  </q-chip>
                  <div class="q-gutter-xs">
                    <q-btn
                      flat
                      dense
                      round
                      color="blue-7"
                      icon="visibility"
                      size="sm"
                      @click="previewFile(model.fileReceipt)"
                    >
                      <q-tooltip>ดูตัวอย่าง</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      color="green-7"
                      icon="download"
                      size="sm"
                      @click="downloadFile(model.fileReceipt)"
                    >
                      <q-tooltip>ดาวน์โหลด</q-tooltip>
                    </q-btn>
                  </div>
                </div>
                <div v-else class="q-ml-md text-grey-5 font-14">
                  ไม่มีไฟล์
                </div>
              </div>
              <!-- Medical Certificate File -->
              <div class="col-12">
                <p class="q-mb-sm">2. ใบรับรองแพทย์</p>
                <div v-if="model.fileMedicalCertificate" class="q-ml-md">
                  <q-chip
                    color="blue-1"
                    text-color="blue-9"
                    icon="description"
                    class="q-mb-xs"
                  >
                    {{ getFileName(model.fileMedicalCertificate) }}
                  </q-chip>
                  <div class="q-gutter-xs">
                    <q-btn
                      flat
                      dense
                      round
                      color="blue-7"
                      icon="visibility"
                      size="sm"
                      @click="previewFile(model.fileMedicalCertificate)"
                    >
                      <q-tooltip>ดูตัวอย่าง</q-tooltip>
                    </q-btn>
                    <q-btn
                      flat
                      dense
                      round
                      color="green-7"
                      icon="download"
                      size="sm"
                      @click="downloadFile(model.fileMedicalCertificate)"
                    >
                      <q-tooltip>ดาวน์โหลด</q-tooltip>
                    </q-btn>
                  </div>
                  <!-- Inline Image Preview for Medical Certificate -->
                  <div v-if="isImageFile(model.fileMedicalCertificate)" class="q-mt-sm">
                    <img 
                      :src="fileMedicalPreviewUrl" 
                      style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer; border: 1px solid #ddd;"
                      @click="previewFile(model.fileMedicalCertificate)"
                      v-if="fileMedicalPreviewUrl"
                    />
                    <q-spinner v-else color="primary" size="30px" />
                  </div>
                </div>
                <div v-else class="q-ml-md text-grey-5 font-14">
                  ไม่มีไฟล์
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- File Preview Dialog -->
      <q-dialog v-model="previewDialog.show" maximized>
        <q-card class="bg-grey-10">
          <q-bar class="bg-grey-9">
            <div class="text-white">{{ previewDialog.fileName }}</div>
            <q-space />
            <q-btn dense flat icon="close" color="white" v-close-popup>
              <q-tooltip>ปิด</q-tooltip>
            </q-btn>
          </q-bar>
          <q-card-section class="full-height row justify-center items-center">
            <q-spinner v-if="previewDialog.loading" color="white" size="50px" />
            <img
              v-else-if="previewDialog.type === 'image'"
              :src="previewDialog.url"
              style="max-width: 90%; max-height: 90vh; object-fit: contain;"
            />
            <iframe
              v-else-if="previewDialog.type === 'pdf'"
              :src="previewDialog.url"
              style="width: 90%; height: 90vh; border: none;"
            />
            <div v-else class="text-white text-h6">
              ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
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
</template>
<style scoped>
.q-table--bordered {
  border-radius: 0;
}
</style>
<script setup>
import PageLayout from "src/layouts/PageLayout.vue";
import InputGroup from "src/components/InputGroup.vue";
import Swal from "sweetalert2";
import { Notify } from "quasar";
import { formatDateThaiSlash, formatNumber } from "src/components/format";
import healthCheckUpWelfareService from "src/boot/service/healthCheckUpWelfareService";
import exportService from "src/boot/service/exportService";
import userManagementService from "src/boot/service/userManagementService";
import { outlinedDownload } from "@quasar/extras/material-icons-outlined";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "src/stores/authStore";
import { textStatusColor } from "src/components/status";
import { remainingText } from "src/components/remaining";
import welfareManagementService from "src/boot/service/welfareManagementService";

defineOptions({
  name: "healthCheckUpWelfareEdit",
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
  fundReceipt: null,
  fileReceipt: null,
  fileMedicalCertificate: null,
  claimByEligible: [
    {
      fundEligible: null,
      fundEligibleName: null,
    },
    {
      fundEligible: null,
      fundEligibleName: null,
    },
    {
      fundEligible: null,
      fundEligibleName: null,
    }
  ],
});
const userData = ref({});
const remaining = ref({});

// File preview refs
const previewDialog = ref({
  show: false,
  loading: false,
  url: null,
  type: null,
  fileName: null,
});

// Inline preview URLs for view mode
const fileReceiptPreviewUrl = ref(null);
const fileMedicalPreviewUrl = ref(null);
let options = ref([]);
const isLoading = ref(false);
const isError = ref({});
const canRequest = ref(false);
const isView = ref(false);
const userInitialData = ref([]);
const isEdit = computed(() => {
  return !isNaN(route.params.id);
});
const isFetchRemaining = ref(false);
onMounted(async () => {
  await init();
  isLoading.value = false;
});

onBeforeUnmount(() => {
  isLoading.value = false;
});
const isValidate = computed(() => {
  let validate = false;
  if (!model.value.fundReceipt) {
    validate = true;
  }
  if (!model.value.createFor) {
    validate = true;
  }
  if (model.value.claimByEligible[2].fundEligible && !model.value.claimByEligible[2].fundEligibleName) {
    validate = true;
  }
  if (!model.value.claimByEligible[2].fundEligible && model.value.claimByEligible[2].fundEligibleName) {
    validate = true;
  }
  if (isOver.value) {
    validate = true;
  }
  if (isOverfundRemaining.value) {
    validate = true;
  }
  return validate;
});

const isOver = computed(() => {
  const fundEligibleSum = Number(model.value.fundReceipt) - (Number(model.value.claimByEligible[0].fundEligible) + Number(model.value.claimByEligible[2].fundEligible));
  return fundEligibleSum <= 0;
});

const fundEligibleSumValue = computed(() => {
  return Number(model.value.fundReceipt) - (Number(model.value.claimByEligible[0].fundEligible) + Number(model.value.claimByEligible[2].fundEligible));
});


const isOverfundRemaining = computed(() => {
  let check = false;
  const fundEligibleSum = Number(model.value.fundReceipt) - (Number(model.value.claimByEligible[0].fundEligible) + Number(model.value.claimByEligible[2].fundEligible));
  const perTimes = remaining.value.perTimesRemaining ? parseFloat(remaining.value.perTimesRemaining.replace(/,/g, "")) : null;
  const fundRemaining = remaining.value.fundRemaining ? parseFloat(remaining.value.fundRemaining.replace(/,/g, "")) : null;
  if (Number(model.value.claimByEligible[1].fundEligible) > fundRemaining && remaining.value.fundRemaining) {
    check = 2;
  }
  else if (Number(model.value.claimByEligible[1].fundEligible) > perTimes && remaining.value.perTimesRemaining) {
    check = 1;
  }
  else if ((model.value.claimByEligible[1].fundEligible > fundEligibleSum)) {
    check = 4;
  }
  if (!canRequest.value && isFetchRemaining.value) {
    check = 3;
  }
  return check;
});

const isErrorFundSum = computed(() => {
  if(isOverfundRemaining.value === 2){
    return 'จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้'
  }
  else if (isOverfundRemaining.value === 1){
    return 'สามารถเบิกได้สูงสุด ' + remaining.value.perTimesRemaining + ' บาทต่อครั้ง'
  }
  else if (isOverfundRemaining.value === 4 && !isOver.value){
    return 'สามารถเบิกได้สูงสุด ' + fundEligibleSumValue.value + ' บาท'
  }
  else if (isOverfundRemaining.value === 3){
    return 'คุณใช้จำนวนการเบิกครบแล้ว'
  }
  return '';
})

watch(
  () => model.value.claimByEligible,
  () => {
    if (isOver.value) {
      isError.value.fundReceipt = "จำนวนตามใบเสร็จต้องมากกว่าเงินที่ได้รับจากสิทธิอื่น ๆ";
    }
    else {
      isError.value.fundReceipt = null;
    }
    if (!model.value.claimByEligible[2]?.fundEligible && !model.value.claimByEligible[2]?.fundEligibleName) return;
    setTimeout(async () => {
      try {
        if (model.value.claimByEligible[2]?.fundEligible && !model.value.claimByEligible[2]?.fundEligibleName) {
          Notify.create({
            message:
              "กรุณากรอกชื่อสิทธิ อื่น ๆ",
            position: "bottom-left",
            type: "negative",
          });
        }
        if (!model.value.claimByEligible[2]?.fundEligible && model.value.claimByEligible[2]?.fundEligibleName) {
          Notify.create({
            message:
              "กรุณากรอกจำนวนเงินที่เบิกตามสิทธิอื่น ๆ",
            position: "bottom-left",
            type: "negative",
          });
        }
      } catch (error) {
        Promise.reject(error);
      }
      isLoading.value = false;
    }, 2000);
  },
  { deep: true }
);
watch(
  () => model.value.fundReceipt,
  (newValue) => {
    if (newValue !== null) {
      delete isError.value.fundReceipt;
    }
  }
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
      const result = await welfareManagementService.dataHealthCheckUpById(route.params.id);
      var returnedData = result.data.datas;
      if (returnedData) {
        model.value = {
          ...model,
          createFor: returnedData?.user.userId,
          reimNumber: returnedData?.reimNumber,
          requestDate: returnedData?.requestDate,
          status: returnedData?.status,
          fundReceipt: returnedData?.fundReceipt,
          fundSumRequest: returnedData?.fundSumRequest,
          fileReceipt: returnedData?.fileReceipt,
          fileMedicalCertificate: returnedData?.fileMedicalCertificate,
          claimByEligible: [
            {
              fundEligible: returnedData?.fundDecree,
            },
            {
              fundEligible: returnedData?.fundUniversity,
            },
            {
              fundEligible: returnedData?.fundEligible,
              fundEligibleName: returnedData?.fundEligibleName,
            }
          ],
        };
        userData.value = {
          name: returnedData?.user.name,
          position: returnedData?.user.position,
          employeeType: returnedData?.user.employeeType,
          sector: returnedData?.user.sector,
          department: returnedData?.user.department,
        };
        row.value[0].fundEligible = returnedData?.fundDecree;
        row.value[0].isInput = false;
        row.value[1].fundEligible = returnedData?.fundUniversity;
        row.value[1].isInput = false;
        row.value[2].isInput = true;
        row.value[2].fundEligible = returnedData?.fundEligible;
        row.value[2].fundEligibleName = returnedData?.fundEligibleName;
        
        // Load inline previews for image files
        if (returnedData?.fileReceipt) {
          loadInlinePreview(returnedData.fileReceipt, 'receipt');
        }
        if (returnedData?.fileMedicalCertificate) {
          loadInlinePreview(returnedData.fileMedicalCertificate, 'medical');
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
    const fetchRemaining = await healthCheckUpWelfareService.getRemaining({ createFor: model.value.createFor });
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
    const result = await exportService.healthCheckup(route.params.id);
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
    let navigate = document.getElementById("fund");
    window.location.hash = "fund";
    navigate.scrollIntoView(false);
    validate = true;
  }
  if (model.value.claimByEligible[2].fundEligible && !model.value.claimByEligible[2].fundEligibleName) {
    validate = true;
  }
  if (!model.value.claimByEligible[2].fundEligible && model.value.claimByEligible[2].fundEligibleName) {
    validate = true;
  }
  if (isOverfundRemaining.value) {
    if (isOverfundRemaining.value === 2) {
      isError.value.fundEligible = "จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้";
    }
    else if (isOverfundRemaining.value === 1) {
      isError.value.fundEligible = "สามารถเบิกได้สูงสุด " + remaining.value.perTimesRemaining + " บาทต่อครั้ง";
    }
    else {
      isError.value.fundEligible = "คุณใช้จำนวนการเบิกครบแล้ว";
    }
    validate = true;
  }
  if (isOver.value) {
    isError.value.fundReceipt = "จำนวนเงินตามใบเสร็จต้องมากกว่าเงินที่ได้รับจากสิทธิอื่น ๆ";
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
    fundDecree: model.value.claimByEligible[0].fundEligible,
    fundUniversity: model.value.claimByEligible[1].fundEligible,
    fundEligible: model.value.claimByEligible[2].fundEligible,
    fundEligibleName: model.value.claimByEligible[2].fundEligibleName,
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
          fetch = await welfareManagementService.updateHealthCheckUp(route.params.id, {
            ...payload,
            isFinalApprove: authStore.roleId === 5,
            isDisburseApprove: authStore.roleId === 2 && model.value.status === "รอจ่ายเงิน",
          });
        }
        else {
          fetch = await healthCheckUpWelfareService.create(payload);
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
// File helper functions
function getFileName(filename) {
  if (!filename) return '';
  return filename.replace(/^\d+-/, '');
}

function getFileType(fileName) {
  if (!fileName) return 'unknown';
  const ext = fileName.split('.').pop().toLowerCase();
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
    const result = await healthCheckUpWelfareService.getFileByName(filename);
    const ext = filename.split('.').pop().toLowerCase();
    let mimeType = 'image/jpeg';
    if (ext === 'png') mimeType = 'image/png';
    
    const blob = new Blob([result.data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    if (type === 'receipt') {
      fileReceiptPreviewUrl.value = url;
    } else {
      fileMedicalPreviewUrl.value = url;
    }
  } catch (error) {
    console.error('Error loading preview:', error);
  }
}

async function previewFile(fileName) {
  if (!fileName) return;
  previewDialog.value = {
    show: true,
    loading: true,
    url: null,
    type: getFileType(fileName),
    fileName: getFileName(fileName),
  };
  try {
    const response = await healthCheckUpWelfareService.getFileByName(fileName);
    const mimeType = getFileType(fileName) === 'pdf' ? 'application/pdf' : 'image/jpeg';
    const blob = new Blob([response.data], { type: mimeType });
    previewDialog.value.url = URL.createObjectURL(blob);
    previewDialog.value.loading = false;
  } catch {
    Notify.create({
      message: 'ไม่สามารถโหลดตัวอย่างไฟล์ได้',
      position: 'bottom-left',
      type: 'negative',
    });
    previewDialog.value.show = false;
  }
}

async function downloadFile(fileName) {
  if (!fileName) return;
  const notify = Notify.create({
    message: 'กำลังดาวน์โหลด...',
    position: 'top-right',
    spinner: true,
    type: 'info',
  });
  try {
    const response = await healthCheckUpWelfareService.getFileByName(fileName);
    const blob = new Blob([response.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Notify.create({
      message: 'ดาวน์โหลดสำเร็จ',
      position: 'top-right',
      type: 'positive',
    });
  } catch {
    Notify.create({
      message: 'ดาวน์โหลดไม่สำเร็จกรุณาลองอีกครั้ง',
      position: 'top-right',
      type: 'negative',
    });
  } finally {
    notify();
  }
}

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
const columns = ref([
  {
    name: "fundEligibleName",
    label: "ชื่อสิทธิ",
    align: "left",
    field: (row) => row.fundEligibleName ?? "-",
    format: (val) => `${val}`,
    classes: "ellipsis",
  },
  {
    name: "fundEligible",
    label: "จำนวนเงิน (บาท)",
    align: "right",
    field: (row) => row.fundEligible ?? "-",
    format: (val) => {
      const number = Number(val); // Convert to number
      if (!isNaN(number)) {
        return number.toLocaleString("en-US"); // Format as '3,000'
      }
      return `${val}`; // If conversion fails, return a fallback value
    },
    classes: "ellipsis",
  },
]);
const row = ref([
  {
    id: 1,
    isInput: false,
    fundEligibleName: 'ได้รับเงินจากสิทธิที่เบิกได้ตามพระราชกฤษฎีกาเงินสวัสดิการเกี่ยวกับการรักษาพยาบาล',
    fundEligible: null,
  },
  {
    id: 2,
    isInput: false,
    fundEligibleName: 'เบิกได้ตามประกาศสวัสดิการคณะกรรมการสวัสดิการ มหาวิทยาลัยบูรพา',
    fundEligible: null,
  },
  {
    id: 3,
    isInput: true,
    fundEligibleName: null,
    fundEligible: null,
  },
]);
</script>
