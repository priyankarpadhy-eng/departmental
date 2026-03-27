import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    paddingTop: 50,
    paddingBottom: 60,
    paddingLeft: 25, // Significantly reduced side padding for maximum header width 
    paddingRight: 25,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.5,
    color: '#000',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15, // Direct spacing from logo to text
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center', // Centers the text relative to the remaining space
    justifyContent: 'center',
  },
  deptName: {
    fontFamily: 'Times-Bold',
    fontSize: 16,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  instName: {
    fontFamily: 'Times-Bold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  refRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 15,
  },
  refText: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
  },
  docTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    fontFamily: 'Times-Bold',
    width: 130,
  },
  infoValue: {
    flex: 1,
  },
  bodyText: {
    marginTop: 10,
    textAlign: 'justify',
  },
  listContainer: {
    marginTop: 10,
    marginLeft: 20,
  },
  listItemRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  listNumber: {
    width: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    right: 50,
    alignItems: 'flex-end',
  },
  signatureProxy: {
    fontFamily: 'Times-Italic',
    fontSize: 18,
    color: '#34495e',
    marginBottom: 10,
  },
  signatureLineContainer: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 4,
    alignItems: 'center',
    width: 180,
  },
  signatoryText: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  digitalSealBox: {
    display: 'none', // deprecated
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    fontSize: 70,
    color: '#000',
    opacity: 0.05,
    transform: 'rotate(-45deg)',
    zIndex: -1,
    fontFamily: 'Helvetica-Bold',
  },
  roundSealContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 130,
    height: 130,
    borderRadius: '100%',
    border: '3 solid #059669',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
  },
  roundSealText: {
    fontSize: 9,
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  roundSealSub: {
    fontSize: 7,
    color: '#059669',
    marginTop: 4,
    textAlign: 'center',
  },
  verifyFooter: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    borderTop: '0.5 solid #666',
    paddingTop: 8,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verifyText: {
    fontSize: 8,
    color: '#444',
  },
  verifyLink: {
    fontSize: 8,
    color: '#059669',
    fontFamily: 'Helvetica-Bold',
  },
})

interface CertProps {
  request: any
}

export const CertificateTemplate = ({ request }: CertProps) => {
  const dateFormatted = new Date(request.updated_at || request.created_at).toLocaleDateString('en-GB')
  const refNo = request.reference_no || `IGIT/CE-02/${new Date().getFullYear()}/${request.id?.substring(0, 4).toUpperCase()}`
  // Use Next.js local absolute URL to fetch from public folder
  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/igit-logo.png` : '/igit-logo.png'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Background Watermark */}
        <Text style={styles.watermark}>
          CIVIL DEPARTMENT IGIT SARANG
        </Text>

        <View style={styles.headerContainer}>
          <Image src={logoUrl} style={styles.logo} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.deptName}>Department of Civil Engineering</Text>
            <Text style={styles.instName}>Indira Gandhi Institute of Technology, Sarang</Text>
          </View>
        </View>
        
        <View style={styles.refRow}>
          <Text style={styles.refText}>{refNo}</Text>
          <Text style={styles.refText}>Date: {dateFormatted}</Text>
        </View>
        
        <Text style={styles.docTitle}>{request.type}</Text>
        <Text style={styles.subtitle}>-- Student Official Document --</Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student Name:</Text>
            <Text style={styles.infoValue}>{request.student_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration No:</Text>
            <Text style={styles.infoValue}>{request.student_registration_no || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Degree Program:</Text>
            <Text style={styles.infoValue}>B.Tech, Civil Engineering</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application Status:</Text>
            <Text style={styles.infoValue}>{request.status?.charAt(0).toUpperCase() + request.status?.slice(1) || 'Approved'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reason/Description:</Text>
            <Text style={styles.infoValue}>{request.reason}</Text>
          </View>
        </View>

        <Text style={styles.bodyText}>
          This is to inform all concerned that the aforementioned student has filed an application through the Department's portal for the provision of {request.type}. 
          The department has verified the details furnished and has officially approved this document. 
        </Text>

        <Text style={{ ...styles.bodyText, marginTop: 15, fontFamily: 'Times-Bold' }}>
          Specific Conditions:
        </Text>

        <View style={styles.listContainer}>
          <View style={styles.listItemRow}>
            <Text style={styles.listNumber}>1.</Text>
            <Text style={styles.infoValue}>This certificate is purely provisional and contingent upon the info furnished by the student.</Text>
          </View>
          <View style={styles.listItemRow}>
            <Text style={styles.listNumber}>2.</Text>
            <Text style={styles.infoValue}>The document holds validity solely for the intent described in the student's statement of reason.</Text>
          </View>
          <View style={styles.listItemRow}>
            <Text style={styles.listNumber}>3.</Text>
            <Text style={styles.infoValue}>Digitally generated records do not require a physical stamp when electronically verified.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {/* Circular Digital Seal */}
          <View style={styles.roundSealContainer}>
            <Text style={styles.roundSealText}>DIGITALLY SIGNED</Text>
            <Text style={styles.roundSealSub}>DEPT. OF CIVIL ENGG</Text>
            <Text style={styles.roundSealSub}>IGIT SARANG</Text>
            <Text style={{ ...styles.roundSealSub, fontSize: 5 }}>[ID:{request.id.slice(0, 8).toUpperCase()}]</Text>
          </View>

          {/* HOD Signature Proxy */}
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.signatureProxy}>HOD-CE</Text>
            <View style={styles.signatureLineContainer}>
              <Text style={styles.signatoryText}>{dateFormatted}</Text>
              <Text style={styles.signatoryText}>Head of Department, CE</Text>
            </View>
          </View>
        </View>

        {/* Verification Footer at the very bottom */}
        <View style={styles.verifyFooter}>
          <Text style={styles.verifyText}>To verify this document, visit: <Text style={styles.verifyLink}>/verify</Text></Text>
          <Text style={styles.verifyText}>Tracking ID: {request.reference_no}</Text>
        </View>
      </Page>
    </Document>
  )
}
