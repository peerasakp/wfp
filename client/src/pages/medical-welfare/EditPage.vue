<template>
  <PageLayout title="เบิกสวัสดิการทั่วไป (กรณีเจ็บป่วย)">
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
              <p class="col-12 q-ma-none">
                {{ remainingText(remaining?.accident, remaining?.accident?.categoryName) }}
              </p>
              <p class="col-12 q-ma-none">
                {{ remainingText(remaining?.patientVisit, remaining?.patientVisit?.categoryName) }}
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
            <q-card-section class="row wrap font-medium q-pb-xs font-16 text-grey-9 items-center"
              :class="isView ? '' : 'q-pl-sm'">
              <q-checkbox v-if="!isView" v-model="model.selectedAccident" />
              <p class="q-mb-none">ประสบอุบัติเหตุขณะปฏิบัติงานในหน้าที่ (จ่ายไม่เกินคนละ {{ remaining?.accident.fund ?
                remaining?.accident.fund + " บาทต่อปี" :
                remaining?.accident.perTimesRemaining ? remaining?.accident.perTimesRemaining + " บาทต่อครั้ง" :
                  remaining?.accident.perTimesRemaining ?? "ไม่จำกัดจำนวนเงิน"
              }})</p>
            </q-card-section>
            <q-card-section class="row wrap font-medium q-pb-xs font-16 text-grey-9">
              <InputGroup for-id="fund-receipt-accident" is-dense v-model="model.fundReceipt"
                :data="model.fundReceipt ?? '-'" is-require label="จำนวนเงินตามใบสำคัญรับเงิน (บาท)"
                :disable="!model.selectedAccident" placeholder="บาท" type="number" :is-view="isView"
                compclass="col-xs-12 col-lg-4 col-xl-3 q-mr-lg-xl"
                :rules="[(val) => !!val || 'กรุณากรอกข้อมูลจำนวนเงินตามใบสำคัญรับเงิน']"
                :error-message="isError?.fundReceipt" :error="!!isError?.fundReceipt">
              </InputGroup>
              <InputGroup for-id="fund-claim-accident" is-dense v-model="model.fundEligible"
                class="q-py-xs-md q-py-lg-none" :data="model.fundEligible ?? '-'" is-require
                label="จำนวนเงินที่ต้องการเบิก (บาท)" placeholder="บาท" type="number" :is-view="isView"
                compclass="col-xs-12 col-lg-4 col-xl-3 q-ml-lg-xl" :disable="!model.selectedAccident" :rules="[
                  (val) => !!val || 'กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก',
                  (val) => model.selectedAccident && !isOverAccident || 'จำนวนเงินที่ต้องการเบิกห้ามมากกว่าจำนวนเงินตามใบเสร็จ',
                  (val) => isOverfundRemainingAccident !== 2 || 'จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้',
                  (val) => isOverfundRemainingAccident !== 1 || 'สามารถเบิกได้สูงสุด ' + (remaining.accident?.perTimesRemaining ?? '-') + ' บาทต่อครั้ง',
                  (val) => isOverfundRemainingAccident !== 3 || 'คุณใช้จำนวนการเบิกครบแล้ว'
                ]" :error-message="isError?.fundEligible" :error="!!isError?.fundEligible">
              </InputGroup>

            </q-card-section>
            <q-card-section class="row wrap q-pt-none font-medium q-pb-xs font-16 text-grey-9 items-center"
              :class="isView ? '' : 'q-pl-sm'">
              <q-checkbox v-if="!isView" v-model="model.selectedPatientVisit" />
              <p class="q-mb-none">ค่าเยี่ยมไข้ผู้ปฏิบัติงาน (กรณีผู้ป่วยใน) คนละไม่เกิน {{ remaining?.patientVisit.fund
                ?
                remaining?.patientVisit.fund + " บาทต่อปี" :
                remaining?.patientVisit.perTimesRemaining ? remaining?.patientVisit.perTimesRemaining + " บาทต่อครั้ง"
                  :
                  remaining?.patientVisit.perTimesRemaining ?? "ไม่จำกัดจำนวนเงิน"
              }} {{ remaining?.patientVisit.perYears ? "ปีนึงไม่เกิน " + remaining?.patientVisit.perYears +
                  " ครั้ง" :
                  remaining?.patientVisit.perYears ?? 'ไม่จำกัดครั้ง' }}</p>
            </q-card-section>
            <q-card-section class="row wrap font-medium q-pb-sm font-16 text-grey-9">
              <InputGroup label="ตั้งแต่วันที่" :is-view="isView" compclass="col-xs-12 col-lg-4 col-xl-3 q-mr-lg-xl"
                clearable :data="model.startDate ?? '-'" is-require>
                <DatePicker :disabled="!model.selectedPatientVisit" class="col-12" is-dense
                  v-model:model="model.startDate" v-model:dateShow="model.startDate" for-id="start-date" :no-time="true"
                  :rules="[(val) => !!val || 'กรุณากรอก วัน/เดือน/ปี ตั้งแต่วันที่']"
                  :error-message="isError?.startDate" :error="!!isError?.startDate" />
              </InputGroup>
              <InputGroup label="ถึงวันที่" :is-view="isView" compclass="col-xs-12 col-lg-4 col-xl-3 q-ml-lg-xl"
                clearable :data="model.endDate ?? '-'" is-require>
                <DatePicker is-dense :disabled="!model.selectedPatientVisit" v-model:model="model.endDate"
                  v-model:dateShow="model.endDate" for-id="end-date" :no-time="true"
                  :rules="[(val) => !!val || 'กรุณากรอก วัน/เดือน/ปี ถึงวันที่']" :error-message="isError?.endDate"
                  :error="!!isError?.endDate" />
              </InputGroup>
            </q-card-section>
            <q-card-section class="q-pt-none row wrap font-medium q-pb-xs font-16 text-grey-9">
              <InputGroup for-id="fund-receipt-visit" is-dense v-model="model.fundReceiptPatientVisit"
                :data="model.fundReceiptPatientVisit ?? '-'" is-require label="จำนวนเงินตามใบสำคัญรับเงิน (บาท)"
                :disable="!model.selectedPatientVisit" placeholder="บาท" type="number" :is-view="isView"
                compclass="col-xs-12 col-lg-4 col-xl-3 q-mr-lg-xl"
                :rules="[(val) => !!val || 'กรุณากรอกข้อมูลจำนวนเงินตามใบสำคัญรับเงิน']"
                :error-message="isError?.fundReceiptPatientVisit" :error="!!isError?.fundReceiptPatientVisit">
              </InputGroup>
              <InputGroup for-id="fund-claim-visit" is-dense v-model="model.fundSumRequestPatientVisit"
                :data="model.fundSumRequestPatientVisit ?? '-'" is-require label="จำนวนเงินที่ต้องการเบิก (บาท)"
                placeholder="บาท" type="number" :is-view="isView" class="q-py-xs-md q-py-lg-none"
                compclass="col-xs-12 col-lg-4 col-xl-3 q-ml-lg-xl" :disable="!model.selectedPatientVisit" :rules="[
                  (val) => !!val || 'กรุณากรอกข้อมูลจำนวนที่ต้องการเบิก',
                  (val) => model.selectedPatientVisit && !isOverPatientVisit || 'จำนวนเงินที่ต้องการเบิกห้ามมากกว่าจำนวนเงินตามใบเสร็จ',
                  (val) => isOverfundRemainingPatientVisit !== 2 || 'จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้',
                  (val) => isOverfundRemainingPatientVisit !== 1 || 'สามารถเบิกได้สูงสุด ' + (remaining.patientVisit?.perTimesRemaining ?? '-') + ' บาทต่อครั้ง',
                  (val) => isOverfundRemainingPatientVisit !== 3 || 'คุณใช้จำนวนการเบิกครบแล้ว'
                ]" :error-message="isError?.fundSumRequestPatientVisit" :error="!!isError?.fundSumRequestPatientVisit">
              </InputGroup>
            </q-card-section>
            <q-card-section class="q-pt-md font-medium font-16">
              <q-table flat bordered :rows="row ?? []" :columns="columns" row-key="index" :wrap-cells="$q.screen.gt.lg"
                table-header-class="font-bold bg-blue-10 text-white" separator="cell" hide-bottom :loading="isLoading">
                <template v-slot:body-cell-index="props">
                  <q-td :props="props">
                    {{ props.rowIndex + 1 }}
                  </q-td>
                </template>
                <template v-slot:body-cell-date="props">
                  <q-td :props="props" v-if="props.row.startDate && props.row.endDate">
                    {{ formatDateThaiSlash(props.row.startDate) + "-" + formatDateThaiSlash(props.row.endDate) }}
                  </q-td>
                  <q-td :props="props" v-else>
                    -
                  </q-td>
                </template>
                <template v-slot:no-data="{ icon }">
                  <div class="full-width row flex-center text-negative q-gutter-sm">
                    <q-icon size="2em" :name="icon" />
                    <span class="font-14 font-regular ">
                      ไม่พบข้อมูล
                    </span>
                  </div>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-md-3 col-12 row">
          <q-card flat bordered class="col-12 full-height">
            <q-card-section class="font-18 font-bold">
              <p class="q-mb-none">หลักฐานที่ต้องแนบ</p>
            </q-card-section>
            <q-separator />
            <q-card-section class="row wrap q-col-gutter-y-md font-medium font-16 text-grey-7">
              <p class="col-12 q-mb-sm q-mt-none font-bold text-black">ประสบอุบัติเหตุขณะปฏิบัติหน้าที่</p>
              <div class="col-12">
                <div class="row items-center justify-between q-mb-xs">
                  <span>1. ใบสำคัญรับเงิน</span>
                  <div v-if="!isView">
                    <input
                      ref="fileReceiptInput"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style="display: none"
                      @change="handleFileReceiptChange"
                    />
                    <q-btn
                      v-if="!fileReceipt.name && !model.fileReceipt"
                      outline
                      color="primary"
                      size="sm"
                      no-caps
                      icon="upload"
                      label="อัปโหลด"
                      @click="triggerFileReceiptUpload"
                      :loading="fileReceipt.uploading"
                    />
                    <div v-else class="row items-center q-gutter-x-sm">
                      <q-chip
                        removable
                        color="blue-2"
                        text-color="blue-9"
                        @remove="removeFileReceipt"
                        :label="fileReceipt.name || getFileName(model.fileReceipt)"
                        class="q-ma-none"
                        size="sm"
                      />
                      <q-btn flat dense round icon="visibility" color="primary" size="sm"
                        @click="previewFile(fileReceipt.file, model.fileReceipt)" title="ดูตัวอย่าง" />
                      <q-btn v-if="model.fileReceipt" flat dense round icon="download" color="primary" size="sm"
                        @click="downloadFile(model.fileReceipt)" title="ดาวน์โหลด" />
                    </div>
                  </div>
                  <div v-else-if="isView && model.fileReceipt" class="row items-center q-gutter-x-sm">
                    <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileReceipt)"
                      class="q-ma-none" size="sm" />
                    <q-btn flat dense round icon="visibility" color="primary" size="sm"
                      @click="previewFile(null, model.fileReceipt)" title="ดูตัวอย่าง" />
                    <q-btn flat dense round icon="download" color="primary" size="sm"
                      @click="downloadFile(model.fileReceipt)" title="ดาวน์โหลด" />
                  </div>
                  <span v-else-if="isView && !model.fileReceipt" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                </div>
              </div>
              <div class="col-12">
                <div class="row items-center justify-between q-mb-sm">
                  <span>2. ใบรับรองแพทย์</span>
                  <div v-if="!isView">
                    <input
                      ref="fileMedicalInput"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      style="display: none"
                      @change="handleFileMedicalChange"
                    />
                    <q-btn
                      v-if="!fileMedical.name && !model.fileMedicalCertificate"
                      outline
                      color="primary"
                      size="sm"
                      no-caps
                      icon="upload"
                      label="อัปโหลด"
                      @click="triggerFileMedicalUpload"
                      :loading="fileMedical.uploading"
                    />
                    <div v-else class="row items-center q-gutter-x-sm">
                      <q-chip
                        removable
                        color="blue-2"
                        text-color="blue-9"
                        @remove="removeFileMedical"
                        :label="fileMedical.name || getFileName(model.fileMedicalCertificate)"
                        class="q-ma-none"
                        size="sm"
                      />
                      <q-btn flat dense round icon="visibility" color="primary" size="sm"
                        @click="previewFile(fileMedical.file, model.fileMedicalCertificate)" title="ดูตัวอย่าง" />
                      <q-btn v-if="model.fileMedicalCertificate" flat dense round icon="download" color="primary" size="sm"
                        @click="downloadFile(model.fileMedicalCertificate)" title="ดาวน์โหลด" />
                    </div>
                  </div>
                  <div v-else-if="isView && model.fileMedicalCertificate" class="row items-center q-gutter-x-sm">
                    <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileMedicalCertificate)"
                      class="q-ma-none" size="sm" />
                    <q-btn flat dense round icon="visibility" color="primary" size="sm"
                      @click="previewFile(null, model.fileMedicalCertificate)" title="ดูตัวอย่าง" />
                    <q-btn flat dense round icon="download" color="primary" size="sm"
                      @click="downloadFile(model.fileMedicalCertificate)" title="ดาวน์โหลด" />
                  </div>
                  <span v-else-if="isView && !model.fileMedicalCertificate" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                </div>
                <div v-if="isView && model.fileMedicalCertificate && isImageFile(model.fileMedicalCertificate)" class="q-mt-sm">
                  <img
                    :src="fileMedicalPreviewUrl"
                    style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer; border: 1px solid #ddd;"
                    @click="previewFile(null, model.fileMedicalCertificate)"
                    v-if="fileMedicalPreviewUrl"
                  />
                  <q-spinner v-else color="primary" size="30px" />
                </div>
              </div>
              <div class="col-12">
                <div class="row items-center justify-between q-mb-sm">
                  <span>3. หนังสือรับรองของหัวหน้าส่วนงาน</span>
                  <div v-if="!isView">
                    <input ref="fileSupervisorInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileSupervisorChange" />
                    <q-btn v-if="!fileSupervisor.name && !model.fileSupervisorLetter" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                      @click="triggerFileSupervisorUpload" :loading="fileSupervisor.uploading" />
                    <div v-else class="row items-center q-gutter-x-sm">
                      <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFileSupervisor"
                        :label="fileSupervisor.name || getFileName(model.fileSupervisorLetter)" class="q-ma-none" size="sm" />
                      <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileSupervisor.file, model.fileSupervisorLetter)" title="ดูตัวอย่าง" />
                      <q-btn v-if="model.fileSupervisorLetter" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileSupervisorLetter)" title="ดาวน์โหลด" />
                    </div>
                  </div>
                  <div v-else-if="isView && model.fileSupervisorLetter" class="row items-center q-gutter-x-sm">
                    <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileSupervisorLetter)" class="q-ma-none" size="sm" />
                    <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileSupervisorLetter)" title="ดูตัวอย่าง" />
                    <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileSupervisorLetter)" title="ดาวน์โหลด" />
                  </div>
                  <span v-else-if="isView && !model.fileSupervisorLetter" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                </div>
              </div>

              <p class="col-12 q-mb-sm q-mt-sm font-bold text-black">ค่าเยี่ยมไข้ผู้ปฏิบัติงาน</p>
              <div class="col-12">
                <div class="row items-center justify-between q-mb-xs">
                  <span>1. ใบสำคัญรับเงิน</span>
                  <div v-if="!isView">
                    <input ref="fileReceiptVisitInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileReceiptVisitChange" />
                    <q-btn v-if="!fileReceiptVisit.name && !model.fileReceiptPatientVisit" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                      @click="triggerFileReceiptVisitUpload" :loading="fileReceiptVisit.uploading" />
                    <div v-else class="row items-center q-gutter-x-sm">
                      <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFileReceiptVisit"
                        :label="fileReceiptVisit.name || getFileName(model.fileReceiptPatientVisit)" class="q-ma-none" size="sm" />
                      <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileReceiptVisit.file, model.fileReceiptPatientVisit)" title="ดูตัวอย่าง" />
                      <q-btn v-if="model.fileReceiptPatientVisit" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileReceiptPatientVisit)" title="ดาวน์โหลด" />
                    </div>
                  </div>
                  <div v-else-if="isView && model.fileReceiptPatientVisit" class="row items-center q-gutter-x-sm">
                    <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileReceiptPatientVisit)" class="q-ma-none" size="sm" />
                    <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileReceiptPatientVisit)" title="ดูตัวอย่าง" />
                    <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileReceiptPatientVisit)" title="ดาวน์โหลด" />
                  </div>
                  <span v-else-if="isView && !model.fileReceiptPatientVisit" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                </div>
              </div>
              <div class="col-12">
                <div class="row items-center justify-between q-mb-sm">
                  <span>2. ใบรับรองแพทย์</span>
                  <div v-if="!isView">
                    <input ref="fileMedicalVisitInput" type="file" accept=".pdf,.jpg,.jpeg,.png" style="display: none" @change="handleFileMedicalVisitChange" />
                    <q-btn v-if="!fileMedicalVisit.name && !model.fileMedicalCertificatePatientVisit" outline color="primary" size="sm" no-caps icon="upload" label="อัปโหลด"
                      @click="triggerFileMedicalVisitUpload" :loading="fileMedicalVisit.uploading" />
                    <div v-else class="row items-center q-gutter-x-sm">
                      <q-chip removable color="blue-2" text-color="blue-9" @remove="removeFileMedicalVisit"
                        :label="fileMedicalVisit.name || getFileName(model.fileMedicalCertificatePatientVisit)" class="q-ma-none" size="sm" />
                      <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(fileMedicalVisit.file, model.fileMedicalCertificatePatientVisit)" title="ดูตัวอย่าง" />
                      <q-btn v-if="model.fileMedicalCertificatePatientVisit" flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileMedicalCertificatePatientVisit)" title="ดาวน์โหลด" />
                    </div>
                  </div>
                  <div v-else-if="isView && model.fileMedicalCertificatePatientVisit" class="row items-center q-gutter-x-sm">
                    <q-chip color="blue-2" text-color="blue-9" :label="getFileName(model.fileMedicalCertificatePatientVisit)" class="q-ma-none" size="sm" />
                    <q-btn flat dense round icon="visibility" color="primary" size="sm" @click="previewFile(null, model.fileMedicalCertificatePatientVisit)" title="ดูตัวอย่าง" />
                    <q-btn flat dense round icon="download" color="primary" size="sm" @click="downloadFile(model.fileMedicalCertificatePatientVisit)" title="ดาวน์โหลด" />
                  </div>
                  <span v-else-if="isView && !model.fileMedicalCertificatePatientVisit" class="text-grey-5 font-14">ไม่มีไฟล์แนบ</span>
                </div>
                <div v-if="isView && model.fileMedicalCertificatePatientVisit && isImageFile(model.fileMedicalCertificatePatientVisit)" class="q-mt-sm">
                  <img :src="fileMedicalVisitPreviewUrl" style="max-width: 100%; max-height: 200px; border-radius: 8px; cursor: pointer; border: 1px solid #ddd;"
                    @click="previewFile(null, model.fileMedicalCertificatePatientVisit)" v-if="fileMedicalVisitPreviewUrl" />
                  <q-spinner v-else color="primary" size="30px" />
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
          style="background : #BFBFBF;" label="ย้อนกลับ" no-caps :to="{ name: 'medical_welfare_list' }" />
        <q-btn :disable="isValidate" id="button-draft"
          class="text-white font-medium bg-blue-9 text-white font-16 weight-8 q-px-lg" dense type="submit"
          label="บันทึกฉบับร่าง" no-caps @click="submit(1)" v-if="!isView && !isLoading" />
        <q-btn :disable="(!canRequest.accident && !canRequest.patientVisit) || isValidate" id="button-approve"
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
import medicalWelfareService from "src/boot/service/medicalWelfareService";
import exportService from "src/boot/service/exportService";
import userManagementService from "src/boot/service/userManagementService";
import { outlinedDownload } from "@quasar/extras/material-icons-outlined";
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "src/stores/authStore";
import { textStatusColor } from "src/components/status";
import { remainingText } from "src/components/remaining";
defineOptions({
  name: "MedicalfareEdit",
});
const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const model = ref({
  createFor: null,
  selectedAccident: false,
  selectedPatientVisit: false,
  fundReceipt: null,
  fundEligible: null,
  fundReceiptPatientVisit: null,
  fundSumRequestPatientVisit: null,
  startDate: null,
  endDate: null,
  fileReceipt: null,
  fileMedicalCertificate: null,
  fileSupervisorLetter: null,
  fileReceiptPatientVisit: null,
  fileMedicalCertificatePatientVisit: null,
});
const userData = ref({});
const remaining = ref({
  accident: {},
  patientVisit: {},
});
let options = ref([]);
const isLoading = ref(false);
const isError = ref({});
const canRequest = ref({
  accident: false,
  patientVisit: false,
});
const isView = ref(false);
const userInitialData = ref([]);
const fileReceiptInput = ref(null);
const fileMedicalInput = ref(null);
const fileSupervisorInput = ref(null);
const fileReceiptVisitInput = ref(null);
const fileMedicalVisitInput = ref(null);
const fileReceipt = ref({ file: null, name: null, uploading: false });
const fileMedical = ref({ file: null, name: null, uploading: false });
const fileSupervisor = ref({ file: null, name: null, uploading: false });
const fileReceiptVisit = ref({ file: null, name: null, uploading: false });
const fileMedicalVisit = ref({ file: null, name: null, uploading: false });
const previewDialog = ref({ show: false, url: null, type: null, fileName: null, serverFileName: null });
const fileReceiptPreviewUrl = ref(null);
const fileMedicalPreviewUrl = ref(null);
const fileMedicalVisitPreviewUrl = ref(null);
const isEdit = computed(() => {
  return !isNaN(route.params.id);
});
const canCreateFor = computed(() => {
  return authStore.isEditor;
});
const isFetchRemaining = ref(false);

onMounted(async () => {
  await init();
  isLoading.value = false;
});

onBeforeUnmount(() => {
  model.value = null;
});
const isValidate = computed(() => {
  let validate = false;
  if (!model.value.selectedAccident && !model.value.selectedPatientVisit) {
    validate = true;
  }
  if (model.value.selectedAccident) {
    if (!model.value.fundReceipt) {
      validate = true;
    }
    if (!model.value.fundEligible) {
      validate = true;
    }
    if (isOverAccident.value) {
      validate = true;
    }
    if (isOverfundRemainingAccident.value) {
      validate = true;
    }
  }
  if (model.value.selectedPatientVisit) {
    if (!model.value.fundReceiptPatientVisit) {
      validate = true;
    }
    if (!model.value.fundSumRequestPatientVisit) {
      validate = true;
    }
    if (!model.value.startDate) {
      validate = true;
    }
    if (!model.value.endDate) {
      validate = true;
    }
    if (isOverPatientVisit.value) {
      validate = true;
    }
    if (isOverfundRemainingPatientVisit.value) {
      validate = true;
    }
  }
  if (!model.value.createFor && canCreateFor.value) {
    validate = true;
  }
  return validate;
});

const isOverAccident = computed(() => {
  return Number(model.value.fundEligible) > Number(model.value.fundReceipt);
});
const isOverPatientVisit = computed(() => {
  return Number(model.value.fundSumRequestPatientVisit) > Number(model.value.fundReceiptPatientVisit);
});

const isOverfundRemainingAccident = computed(() => {
  const fundSumRequest = Number(model.value.fundEligible ?? 0);
  const perTimes = remaining.value.accident?.perTimesRemaining ? parseFloat(remaining.value.accident?.perTimesRemaining.replace(/,/g, "")) : null;
  const fundRemaining = remaining.value.accident?.fundRemaining ? parseFloat(remaining.value.accident?.fundRemaining.replace(/,/g, "")) : null;
  let check = false;
  if (fundSumRequest > fundRemaining && remaining.value.accident?.fundRemaining) {
    check = 2;
  }
  else if (fundSumRequest > perTimes && remaining.value.accident?.perTimesRemaining) {
    check = 1;
  }
  if (!canRequest.value.accident && isFetchRemaining.value) {
    check = 3;
  }
  return check;
});
const isOverfundRemainingPatientVisit = computed(() => {
  const fundSumRequest = Number(model.value.fundSumRequestPatientVisit ?? 0);
  const perTimes = remaining.value.patientVisit?.perTimesRemaining ? parseFloat(remaining.value.patientVisit?.perTimesRemaining.replace(/,/g, "")) : null;
  const fundRemaining = remaining.value.patientVisit?.fundRemaining ? parseFloat(remaining.value.patientVisit?.fundRemaining.replace(/,/g, "")) : null;
  let check = false;
  if (fundSumRequest > fundRemaining && remaining.value.patientVisit?.fundRemaining) {
    check = 2;
  }
  else if (fundSumRequest > perTimes && remaining.value.patientVisit?.perTimesRemaining) {
    check = 1;
  }
  if (!canRequest.value.patientVisit && isFetchRemaining.value) {
    check = 3;
  }
  return check;
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
watch(
  () => model.value.startDate,
  (newValue) => {
    if (model.value.endDate < newValue && newValue && model.value.endDate) {
      model.value.endDate = null;
    }
  }
);

watch(
  () => model.value.endDate,
  (newValue) => {
    if (newValue < model.value.startDate) {
      model.value.endDate = model.value.startDate;
    }
  }
);
watch(
  () => model.value.selectedAccident,
  (newValue) => {
    if (!newValue) {
      model.value.fundReceipt = null;
      model.value.fundEligible = null;
    }
  }
);
watch(
  () => model.value.selectedPatientVisit,
  (newValue) => {
    if (!newValue) {
      model.value.fundReceiptPatientVisit = null;
      model.value.fundSumRequestPatientVisit = null;
      model.value.startDate = null;
      model.value.endDate = null;
    }
  }
);
async function fetchDataEdit() {
  setTimeout(async () => {
    try {
      const result = await medicalWelfareService.dataById(route.params.id);
      var returnedData = result.data.datas;
      if (returnedData) {
        model.value = {
          ...model,
          createFor: returnedData?.user.userId,
          reimNumber: returnedData?.reimNumber,
          requestDate: returnedData?.requestDate,
          selectedAccident: returnedData?.fundEligible ? true : false,
          selectedPatientVisit: returnedData?.fundSumRequestPatientVisit ? true : false,
          status: returnedData?.status,
          fundReceipt: returnedData?.fundReceipt,
          fundEligible: returnedData?.fundEligible,
          fundReceiptPatientVisit: returnedData?.fundReceiptPatientVisit,
          fundSumRequestPatientVisit: returnedData?.fundSumRequestPatientVisit,
          startDate: isView.value === true ? formatDateThaiSlash(returnedData?.startDate) : formatDateSlash(returnedData?.startDate),
          endDate: isView.value === true ? formatDateThaiSlash(returnedData?.endDate) : formatDateSlash(returnedData?.endDate),
          fundSumRequest: returnedData?.fundSumRequest,
          fundEligibleSum: returnedData?.fundEligibleSum,
          fileReceipt: returnedData?.fileReceipt,
          fileMedicalCertificate: returnedData?.fileMedicalCertificate,
          fileSupervisorLetter: returnedData?.fileSupervisorLetter,
          fileReceiptPatientVisit: returnedData?.fileReceiptPatientVisit,
          fileMedicalCertificatePatientVisit: returnedData?.fileMedicalCertificatePatientVisit,
        };
        if (isView.value) {
          if (returnedData?.fileReceipt) loadInlinePreview(returnedData.fileReceipt, 'receipt');
          if (returnedData?.fileMedicalCertificate) loadInlinePreview(returnedData.fileMedicalCertificate, 'medical');
          if (returnedData?.fileMedicalCertificatePatientVisit) loadInlinePreview(returnedData.fileMedicalCertificatePatientVisit, 'medicalVisit');
        }
        userData.value = {
          name: returnedData?.user.name,
          position: returnedData?.user.position,
          employeeType: returnedData?.user.employeeType,
          sector: returnedData?.user.sector,
          department: returnedData?.user.department,
        };
        if (Array.isArray(returnedData?.requestData) && returnedData?.requestData.length > 0) {
          row.value = returnedData?.requestData ?? backupRow;
        }
        else {
          row.value = backupRow;
        }
      }
    } catch (error) {
      router.replace({ name: "medical_welfare_list" });
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
    const fetchRemaining = await medicalWelfareService.getRemaining({ createFor: model.value.createFor });
    const accidentData = fetchRemaining.data?.datas[0];
    const patientVisitData = fetchRemaining.data?.datas[1];
    if (accidentData.requestsRemaining != null && !isNaN(Number(accidentData.requestsRemaining))) {
      remaining.value.accident.requestsRemaining = formatNumber(accidentData.requestsRemaining);
    }
    if (accidentData.fundRemaining != null && !isNaN(Number(accidentData.fundRemaining))) {
      remaining.value.accident.fundRemaining = formatNumber(accidentData.fundRemaining);
    }
    if (accidentData.perTimesRemaining != null && !isNaN(Number(accidentData.perTimesRemaining))) {
      remaining.value.accident.perTimesRemaining = formatNumber(accidentData.perTimesRemaining);
    }
    if (accidentData.perUsersRemaining != null && !isNaN(Number(accidentData.perUsersRemaining))) {
      remaining.value.accident.perUsersRemaining = formatNumber(accidentData.perUsersRemaining);
    }
    if (accidentData.fund != null && !isNaN(Number(accidentData.fund))) {
      remaining.value.accident.fund = formatNumber(accidentData.fund);
    }
    if (accidentData.perYears != null && !isNaN(Number(accidentData.perYears))) {
      remaining.value.accident.perYears = formatNumber(accidentData.perYears);
    }
    if (accidentData.subCategoriesName != null) {
      remaining.value.accident.categoryName = accidentData.subCategoriesName;
    }
    if (patientVisitData.requestsRemaining != null && !isNaN(Number(patientVisitData.requestsRemaining))) {
      remaining.value.patientVisit.requestsRemaining = formatNumber(patientVisitData.requestsRemaining);
    }
    if (patientVisitData.fundRemaining != null && !isNaN(Number(patientVisitData.fundRemaining))) {
      remaining.value.patientVisit.fundRemaining = formatNumber(patientVisitData.fundRemaining);
    }
    if (patientVisitData.perTimesRemaining != null && !isNaN(Number(patientVisitData.perTimesRemaining))) {
      remaining.value.patientVisit.perTimesRemaining = formatNumber(patientVisitData.perTimesRemaining);
    }
    if (patientVisitData.perUsersRemaining != null && !isNaN(Number(patientVisitData.perUsersRemaining))) {
      remaining.value.patientVisit.perUsersRemaining = formatNumber(patientVisitData.perUsersRemaining);
    }
    if (patientVisitData.fund != null && !isNaN(Number(patientVisitData.fund))) {
      remaining.value.patientVisit.fund = formatNumber(patientVisitData.fund);
    }
    if (patientVisitData.perYears != null && !isNaN(Number(patientVisitData.perYears))) {
      remaining.value.patientVisit.perYears = formatNumber(patientVisitData.perYears);
    }
    if (patientVisitData.subCategoriesName != null) {
      remaining.value.patientVisit.categoryName = patientVisitData.subCategoriesName;
    }
    canRequest.value.accident = accidentData.canRequest;
    canRequest.value.patientVisit = patientVisitData.canRequest;
    if (Array.isArray(patientVisitData?.requestData) && patientVisitData?.requestData.length > 0) {
      row.value = patientVisitData?.requestData ?? backupRow;
    }
    else {
      row.value = backupRow;
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
    const result = await exportService.medical(route.params.id);
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
  if (filename.startsWith('visit-receipt-')) {
    const match = filename.match(/^visit-receipt-\d{8}-(.+)$/);
    if (match && match[1]) return match[1];
  }
  if (filename.startsWith('receipt-')) {
    const match = filename.match(/^receipt-\d{8}-(.+)$/);
    if (match && match[1]) return match[1];
  }
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
    const result = await medicalWelfareService.getFileByName(filename);
    const ext = filename.split('.').pop().toLowerCase();
    let mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    const blob = new Blob([result.data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    if (type === 'receipt') fileReceiptPreviewUrl.value = url;
    else if (type === 'medical') fileMedicalPreviewUrl.value = url;
    else if (type === 'medicalVisit') fileMedicalVisitPreviewUrl.value = url;
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
      const result = await medicalWelfareService.getFileByName(serverFileName);
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
function triggerFileReceiptUpload() { fileReceiptInput.value?.click(); }
function triggerFileMedicalUpload() { fileMedicalInput.value?.click(); }
function triggerFileSupervisorUpload() { fileSupervisorInput.value?.click(); }
function triggerFileReceiptVisitUpload() { fileReceiptVisitInput.value?.click(); }
function triggerFileMedicalVisitUpload() { fileMedicalVisitInput.value?.click(); }

async function handleFileReceiptChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  fileReceipt.value.file = file;
  fileReceipt.value.name = file.name;
  if (isEdit.value && route.params.id) await uploadFileToServer('receipt', file);
  else Notify.create({ message: 'เลือกไฟล์สำเร็จ จะอัปโหลดหลังจากบันทึกข้อมูล', position: 'bottom-left', type: 'info' });
}
async function handleFileMedicalChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  fileMedical.value.file = file;
  fileMedical.value.name = file.name;
  if (isEdit.value && route.params.id) await uploadFileToServer('medical_certificate', file);
  else Notify.create({ message: 'เลือกไฟล์สำเร็จ จะอัปโหลดหลังจากบันทึกข้อมูล', position: 'bottom-left', type: 'info' });
}
async function handleFileSupervisorChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  fileSupervisor.value.file = file;
  fileSupervisor.value.name = file.name;
  if (isEdit.value && route.params.id) await uploadFileToServer('supervisor_letter', file);
  else Notify.create({ message: 'เลือกไฟล์สำเร็จ จะอัปโหลดหลังจากบันทึกข้อมูล', position: 'bottom-left', type: 'info' });
}
async function handleFileReceiptVisitChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  fileReceiptVisit.value.file = file;
  fileReceiptVisit.value.name = file.name;
  if (isEdit.value && route.params.id) await uploadFileToServer('receipt_patient_visit', file);
  else Notify.create({ message: 'เลือกไฟล์สำเร็จ จะอัปโหลดหลังจากบันทึกข้อมูล', position: 'bottom-left', type: 'info' });
}
async function handleFileMedicalVisitChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  fileMedicalVisit.value.file = file;
  fileMedicalVisit.value.name = file.name;
  if (isEdit.value && route.params.id) await uploadFileToServer('medical_certificate_patient_visit', file);
  else Notify.create({ message: 'เลือกไฟล์สำเร็จ จะอัปโหลดหลังจากบันทึกข้อมูล', position: 'bottom-left', type: 'info' });
}

const fileUploadConfig = {
  receipt: { ref: fileReceipt, key: 'fileReceipt', modelKey: 'fileReceipt' },
  medical_certificate: { ref: fileMedical, key: 'fileMedicalCertificate', modelKey: 'fileMedicalCertificate' },
  supervisor_letter: { ref: fileSupervisor, key: 'fileSupervisorLetter', modelKey: 'fileSupervisorLetter' },
  receipt_patient_visit: { ref: fileReceiptVisit, key: 'fileReceiptPatientVisit', modelKey: 'fileReceiptPatientVisit' },
  medical_certificate_patient_visit: { ref: fileMedicalVisit, key: 'fileMedicalCertificatePatientVisit', modelKey: 'fileMedicalCertificatePatientVisit' }
};
async function uploadFileToServer(type, file) {
  const config = fileUploadConfig[type];
  if (!config) return;
  const formData = new FormData();
  config.ref.value.uploading = true;
  formData.append(config.key, file);
  try {
    const result = await medicalWelfareService.uploadFile(route.params.id, formData);
    if (result.data.files) {
      Object.keys(result.data.files).forEach(k => {
        if (model.value[k] !== undefined) model.value[k] = result.data.files[k];
      });
    }
    Notify.create({ message: 'อัปโหลดไฟล์สำเร็จ', position: 'bottom-left', type: 'positive' });
  } catch (error) {
    Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์', position: 'bottom-left', type: 'negative' });
    config.ref.value.file = null;
    config.ref.value.name = null;
  } finally {
    config.ref.value.uploading = false;
  }
}
async function removeFileReceipt() {
  if (model.value.fileReceipt && isEdit.value && route.params.id) {
    try {
      await medicalWelfareService.deleteFile(route.params.id, 'receipt');
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
      await medicalWelfareService.deleteFile(route.params.id, 'medical_certificate');
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
async function removeFileSupervisor() {
  if (model.value.fileSupervisorLetter && isEdit.value && route.params.id) {
    try {
      await medicalWelfareService.deleteFile(route.params.id, 'supervisor_letter');
      model.value.fileSupervisorLetter = null;
      Notify.create({ message: 'ลบไฟล์สำเร็จ', position: 'bottom-left', type: 'positive' });
    } catch (error) {
      Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบไฟล์', position: 'bottom-left', type: 'negative' });
      return;
    }
  }
  fileSupervisor.value.file = null;
  fileSupervisor.value.name = null;
  if (fileSupervisorInput.value) fileSupervisorInput.value.value = '';
}
async function removeFileReceiptVisit() {
  if (model.value.fileReceiptPatientVisit && isEdit.value && route.params.id) {
    try {
      await medicalWelfareService.deleteFile(route.params.id, 'receipt_patient_visit');
      model.value.fileReceiptPatientVisit = null;
      Notify.create({ message: 'ลบไฟล์สำเร็จ', position: 'bottom-left', type: 'positive' });
    } catch (error) {
      Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบไฟล์', position: 'bottom-left', type: 'negative' });
      return;
    }
  }
  fileReceiptVisit.value.file = null;
  fileReceiptVisit.value.name = null;
  if (fileReceiptVisitInput.value) fileReceiptVisitInput.value.value = '';
}
async function removeFileMedicalVisit() {
  if (model.value.fileMedicalCertificatePatientVisit && isEdit.value && route.params.id) {
    try {
      await medicalWelfareService.deleteFile(route.params.id, 'medical_certificate_patient_visit');
      model.value.fileMedicalCertificatePatientVisit = null;
      Notify.create({ message: 'ลบไฟล์สำเร็จ', position: 'bottom-left', type: 'positive' });
    } catch (error) {
      Notify.create({ message: error?.response?.data?.message ?? 'เกิดข้อผิดพลาดในการลบไฟล์', position: 'bottom-left', type: 'negative' });
      return;
    }
  }
  fileMedicalVisit.value.file = null;
  fileMedicalVisit.value.name = null;
  if (fileMedicalVisitInput.value) fileMedicalVisitInput.value.value = '';
}
async function downloadFile(fileName) {
  if (!fileName) return;
  const notify = Notify.create({ message: 'กำลังดาวน์โหลด...', position: 'top-right', spinner: true, type: 'info' });
  try {
    const result = await medicalWelfareService.getFileByName(fileName);
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
  if (!model.value.selectedAccident && !model.value.selectedPatientVisit) {
    Notify.create({
      message: "กรุณากรอกสวัสดิการที่ต้องการเบิก",
      position: "bottom-left",
      type: "negative",
    });
    return;
  }
  if (model.value.selectedAccident) {
    if (!model.value.fundReceipt) {
      isError.value.fundReceipt = "กรุณากรอกข้อมูลจำนวนเงินตามใบสำคัญรับเงิน";
      validate = true;
    }
    if (!model.value.fundEligible) {
      isError.value.fundEligible = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก";
      validate = true;
    }
    if (isOverfundRemainingAccident.value) {
      if (isOverfundRemainingPatientVisit.value === 2) {
        isError.value.fundEligible = "จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้";
      }
      else {
        isError.value.fundEligible = "สามารถเบิกได้สูงสุด " + remaining.value.accident?.perTimesRemaining + " บาทต่อครั้ง";
      }
      validate = true;
    }
  }
  if (model.value.selectedPatientVisit) {
    if (!model.value.fundReceiptPatientVisit) {
      isError.value.fundReceiptPatientVisit = "กรุณากรอกข้อมูลจำนวนเงินตามใบสำคัญรับเงิน";
      validate = true;
    }
    if (!model.value.fundSumRequestPatientVisit) {
      isError.value.fundSumRequestPatientVisit = "กรุณากรอกข้อมูลจำนวนเงินที่ต้องการเบิก";
      validate = true;
    }
    if (!model.value.startDate) {
      isError.value.startDate = "กรุณากรอก วัน/เดือน/ปี ตั้งแต่วันที่";
      validate = true;
    }
    if (!model.value.endDate) {
      isError.value.endDate = "กรุณากรอก วัน/เดือน/ปี ถึงวันที่";
      validate = true;
    }
    if (isOverfundRemainingPatientVisit.value) {
      if (isOverfundRemainingPatientVisit.value === 2) {
        isError.value.fundSumRequestPatientVisit = "จำนวนที่ขอเบิกเกินจำนวนที่สามารถเบิกได้";
      }
      else {
        isError.value.fundSumRequestPatientVisit = "สามารถเบิกได้สูงสุด " + remaining.value.patientVisit?.perTimesRemaining + " บาทต่อครั้ง";
      }
      validate = true;
    }
  }
  if (!model.value.createFor && canCreateFor.value) {
    isError.value.createFor = "โปรดเลือกผู้ใช้งาน";
    let navigate = document.getElementById("fund-receipt");
    window.location.hash = "fund-receipt";
    navigate.scrollIntoView(false);
    validate = true;
  }
  if (isOverAccident.value) {
    isError.value.fundEligible = "จำนวนเงินที่ต้องการเบิกห้ามมากว่าจำนวนเงินตามใบเสร็จ";
    validate = true;
  }
  if (isOverPatientVisit.value) {
    isError.value.fundSumRequestPatientVisit = "จำนวนเงินที่ต้องการเบิกห้ามมากว่าจำนวนเงินตามใบเสร็จ";
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
    selectedAccident: model.value.selectedAccident,
    selectedPatientVisit: model.value.selectedPatientVisit,
    fundReceipt: model.value.fundReceipt,
    fundEligible: model.value.fundEligible,
    fundReceiptPatientVisit: model.value.fundReceiptPatientVisit,
    fundSumRequestPatientVisit: model.value.fundSumRequestPatientVisit,
    startDate: model.value.startDate ? formatDateServer(model.value.startDate) : null,
    endDate: model.value.endDate ? formatDateServer(model.value.endDate) : null,
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
          fetch = await medicalWelfareService.update(route.params.id, payload);
        }
        else {
          fetch = await medicalWelfareService.create(payload);
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
      const newRecordId = fetch.data?.newItem?.id || route.params.id;
      const hasFiles = fileReceipt.value.file || fileMedical.value.file || fileSupervisor.value.file || fileReceiptVisit.value.file || fileMedicalVisit.value.file;
      if (newRecordId && hasFiles) {
        try {
          const formData = new FormData();
          if (fileReceipt.value.file) formData.append('fileReceipt', fileReceipt.value.file);
          if (fileMedical.value.file) formData.append('fileMedicalCertificate', fileMedical.value.file);
          if (fileSupervisor.value.file) formData.append('fileSupervisorLetter', fileSupervisor.value.file);
          if (fileReceiptVisit.value.file) formData.append('fileReceiptPatientVisit', fileReceiptVisit.value.file);
          if (fileMedicalVisit.value.file) formData.append('fileMedicalCertificatePatientVisit', fileMedicalVisit.value.file);
          await medicalWelfareService.uploadFile(newRecordId, formData);
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
        router.replace({ name: "medical_welfare_list" });
      });
    }
  });
}
const backupRow = [
  {
    id: 1,
    startDate: null,
    endDate: null,
    fundSumRequestPatientVisit: "-",
  },
  {
    id: 2,
    startDate: null,
    endDate: null,
    fundSumRequestPatientVisit: "-",
  },
  {
    id: 3,
    startDate: null,
    endDate: null,
    fundSumRequestPatientVisit: "-",
  },
];

const row = ref([
  {
    id: 1,
    startDate: null,
    endDate: null,
    fundSumRequestPatientVisit: "-",
  },
  {
    id: 2,
    startDate: null,
    endDate: null,
    fundSumRequestPatientVisit: "-",
  },
  {
    id: 3,
    startDate: null,
    endDate: null,
    fundSumRequestPatientVisit: "-",
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
    name: "date",
    label: "วัน/เดือน/ปี",
    align: "left",
    field: (row) => row.startDate ?? "",
    classes: "ellipsis",
  },
  {
    name: "fundSumRequestPatientVisit",
    label: "จำนวนเงิน (บาท)",
    align: "right",
    field: (row) => row.fundSumRequestPatientVisit ?? "-",
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
      fetchRemaining();
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
