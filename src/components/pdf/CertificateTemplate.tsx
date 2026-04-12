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
    top: '30%',
    left: '20%',
    width: 350,
    opacity: 0.05,
  },
  stampContainer: {
    borderWidth: 1.5,
    borderColor: '#000',
    padding: 10,
    width: 160,
    height: 90,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stampText: {
    fontSize: 10,
    color: '#000',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  stampSub: {
    fontSize: 8,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Helvetica',
  },
  legalClause: {
    fontSize: 7,
    color: '#333',
    fontFamily: 'Times-Italic',
    textAlign: 'center',
    width: 180,
    marginTop: 5,
  },
  verifyFooter: {
    position: 'absolute',
    bottom: 25,
    left: 25,
    right: 25,
    borderTopWidth: 0.5,
    borderTopColor: '#666',

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

export const CertificateTemplate = ({ request = {} }: CertProps) => {
  // Safe date parsing helper
  const formatDate = (val: any) => {
    if (!val) return 'N/A'
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('en-GB')
    const date = new Date(val)
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-GB')
  }

  const dateFormatted = formatDate(request?.updated_at || request?.created_at)
  const reqId = request?.id || 'NOID'
  const refNo = request?.reference_no || `IGIT/CE-02/${new Date().getFullYear()}/${reqId.substring(0, 4).toUpperCase()}`
  
  // Use Next.js local absolute URL to fetch from public folder
  const logoUrl = '/igit-logo.png' // Use absolute path from public


  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Background Watermark */}
        <Image src={logoUrl} style={styles.watermark} />


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
        
        <Text style={styles.docTitle}>{request?.type || 'Official Document'}</Text>
        <Text style={styles.subtitle}>-- Student Official Document --</Text>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Student Name:</Text>
            <Text style={styles.infoValue}>{request?.student_name || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration No:</Text>
            <Text style={styles.infoValue}>{request?.student_registration_no || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Degree Program:</Text>
            <Text style={styles.infoValue}>B.Tech, Civil Engineering</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Application Status:</Text>
            <Text style={styles.infoValue}>{request?.status ? (request.status.charAt(0).toUpperCase() + request.status.slice(1)) : 'Approved'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reason/Description:</Text>
            <Text style={styles.infoValue}>{request?.reason || 'Document Request'}</Text>
          </View>
        </View>

        <Text style={styles.bodyText}>
          This is to inform all concerned that the aforementioned student has filed an application through the Department's portal for the provision of {request?.type || 'requested documentation'}. 
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
          {/* Rectangular Black Stamp */}
          <View style={{ alignItems: 'center' }}>
            <View style={styles.stampContainer}>
              <Text style={styles.stampText}>DIGITALLY SIGNED</Text>
              <Text style={styles.stampSub}>DEPT. OF CIVIL ENGG</Text>
              <Text style={styles.stampSub}>IGIT SARANG</Text>
              <Text style={{ ...styles.stampSub, fontSize: 6, marginTop: 4 }}>ID: {reqId.toUpperCase()}</Text>
              <Text style={{ ...styles.stampSub, fontSize: 6 }}>DATE: {dateFormatted}</Text>
            </View>
            
            {/* Legal Clause below the stamp */}
            <Text style={styles.legalClause}>
              As per IT Act 2000, this digital signature is legally valid and holds the same value as a physical signature.
            </Text>
          </View>

          {/* HOD Signature Proxy */}
          <View style={{ alignItems: 'center', marginTop: 15 }}>
            <Text style={styles.signatureProxy}>HOD-CE</Text>
            <View style={styles.signatureLineContainer}>
              <Text style={styles.signatoryText}>Head of Department, CE</Text>
            </View>
          </View>
        </View>

        {/* Verification Footer at the very bottom */}
        <View style={styles.verifyFooter}>
          <Text style={styles.verifyText}>To verify this document, visit: <Text style={styles.verifyLink}>/verify</Text></Text>
          <Text style={styles.verifyText}>Tracking ID: {refNo}</Text>
        </View>
      </Page>
    </Document>
  )
}
