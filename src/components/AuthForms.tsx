import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Star, Users, ArrowLeft, Phone } from "lucide-react";
import { getRule, isValidForCountry, ensurePrefix } from "@/lib/phone";
import { loginSchema, signupSchema, resetPasswordSchema, type LoginFormData, type SignupFormData } from "@/lib/auth-schemas";
import { useLocalization } from "@/hooks/useLocalization";
import { countries } from "@/lib/currencies";
import { getProvinces } from "@/lib/provinces";

interface LoginFormProps {
  onShowPassword: boolean;
  onTogglePassword: () => void;
  loading: boolean;
}

export const LoginForm = ({ onShowPassword, onTogglePassword, loading }: LoginFormProps) => {
  const { toast } = useToast();
  const [loginData, setLoginData] = useState<LoginFormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        toast({
          title: "Erro de login",
          description: error.message.includes('Invalid login credentials')
            ? "Email ou senha incorretos. Tente novamente."
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Login realizado!", description: "Bem-vindo de volta à plataforma." });
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Tente novamente.", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="seu@email.com"
          value={loginData.email}
          onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
          className={`h-12 ${errors.email ? 'border-destructive' : ''}`}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={onShowPassword ? "text" : "password"}
            placeholder="Sua senha"
            value={loginData.password}
            onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
            className={`h-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={onTogglePassword}
          >
            {onShowPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <Button type="submit" className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
};

export const SignupForm = ({ onShowPassword, onTogglePassword, loading }: LoginFormProps) => {
  const { toast } = useToast();
  const { country, setCountry } = useLocalization();
  const [province, setProvince] = useState<string>("");
  const [signupData, setSignupData] = useState<SignupFormData>({ name: '', role: 'creator', email: undefined, password: '', phone: '', age: 18 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState<string>("");
  const [sendingOtp, setSendingOtp] = useState<boolean>(false);
  const [verifyingOtp, setVerifyingOtp] = useState<boolean>(false);
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false);

  useEffect(() => {
    const rule = getRule(country);
    setSignupData(prev => {
      const current = prev.phone || "";
      const normalized = current.replace(/\s|-/g, "");
      if (!normalized.startsWith(rule.prefix)) {
        return { ...prev, phone: rule.prefix };
      }
      return prev;
    });
  }, [country]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const rule = getRule(country);
    const result = signupSchema.safeParse({ ...signupData, age: Number(signupData.age || 18) });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    if (!isValidForCountry(signupData.phone, country)) {
      setErrors(prev => ({ ...prev, phone: `Telefone inválido para ${country}. Use ${rule.prefix} + ${rule.min}–${rule.max} dígitos.` }));
      return;
    }
    if (!phoneVerified) {
      setErrors(prev => ({ ...prev, phone: "Verifique seu telefone via SMS antes de prosseguir." }));
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/`;
      const url = new URL(window.location.href);
      const referral = url.searchParams.get("ref");
      const referralRole = url.searchParams.get("role");

      // Capture detected location from localStorage
      const storedCoords = localStorage.getItem('statusads_coords');
      let coords = { lat: null, lon: null };
      if (storedCoords) {
        try {
          const parsed = JSON.parse(storedCoords);
          coords = { lat: parsed.lat, lon: parsed.lon };
        } catch (e) {
          console.error("Error parsing stored coords", e);
        }
      }

      const storedLocalization = localStorage.getItem('statusads_localization');
      let countryCode = null;
      if (storedLocalization) {
        try {
          const parsed = JSON.parse(storedLocalization);
          countryCode = parsed.country;
        } catch (e) {
          console.error("Error parsing stored localization", e);
        }
      }

      const cleanPhone = ensurePrefix(signupData.phone, country);
      const { error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: signupData.name,
            role: signupData.role,
            referral_source: referral,
            referral_target_role: referralRole,
            latitude: coords.lat,
            longitude: coords.lon,
            country_code: countryCode || country,
            province,
            phone_e164: cleanPhone,
            age: Number(signupData.age || 18)
          }
        }
      });

      if (error) {
        toast({
          title: error.message.includes('User already registered') ? "Usuário já existe" : "Erro no cadastro",
          description: error.message.includes('User already registered')
            ? "Este email já está registrado. Faça login."
            : error.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Cadastro realizado!", description: "Confirme seu email para ativar sua conta." });
        setSignupData({ name: '', role: 'creator', email: undefined, password: '', phone: getRule(country).prefix, age: 18 });
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Tente novamente.", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signup-name">Nome Completo</Label>
        <Input
          id="signup-name"
          placeholder="Seu nome completo"
          value={signupData.name}
          onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
          className={`h-12 ${errors.name ? 'border-destructive' : ''}`}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-phone">Telefone (internacional)</Label>
        <div className="relative">
          <Input
            id="signup-phone"
            type="tel"
            placeholder={`ex: ${getRule(country).prefix}${'X'.repeat(getRule(country).min)}`}
            value={signupData.phone}
            onChange={(e) => setSignupData(prev => ({ ...prev, phone: e.target.value }))}
            className={`h-12 ${errors.phone ? 'border-destructive' : ''}`}
          />
        </div>
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              const phone = ensurePrefix(signupData.phone, country);
              if (!isValidForCountry(phone, country)) {
                setErrors(prev => ({ ...prev, phone: "Telefone inválido." }));
                return;
              }
              setSendingOtp(true);
              try {
                const { error } = await supabase.auth.signInWithOtp({ phone });
                if (error) {
                  setErrors(prev => ({ ...prev, phone: error.message }));
                } else {
                  setErrors(prev => ({ ...prev, phone: "" }));
                }
              } finally {
                setSendingOtp(false);
              }
            }}
            disabled={sendingOtp}
          >
            {sendingOtp ? "Enviando..." : "Enviar código"}
          </Button>
          <Input
            placeholder="Código SMS"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="h-9 max-w-[160px]"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              const phone = ensurePrefix(signupData.phone, country);
              if (!otp.trim()) return;
              setVerifyingOtp(true);
              try {
                const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
                if (error) {
                  setErrors(prev => ({ ...prev, phone: "Código inválido." }));
                  setPhoneVerified(false);
                } else {
                  setErrors(prev => ({ ...prev, phone: "" }));
                  setPhoneVerified(true);
                }
              } finally {
                setVerifyingOtp(false);
              }
            }}
            disabled={verifyingOtp}
          >
            {verifyingOtp ? "Verificando..." : "Verificar"}
          </Button>
          {phoneVerified && <Badge variant="outline" className="text-success">Verificado</Badge>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-age">Idade</Label>
        <Input
          id="signup-age"
          type="number"
          min={13}
          max={100}
          placeholder="ex: 21"
          value={signupData.age}
          onChange={(e) => setSignupData(prev => ({ ...prev, age: Number(e.target.value || 18) }))}
          className={`h-12 ${errors.age ? 'border-destructive' : ''}`}
        />
        {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-role">Tipo de Conta</Label>
        <Select value={signupData.role} onValueChange={(value: "creator" | "advertiser") => setSignupData(prev => ({ ...prev, role: value }))}>
          <SelectTrigger className={`h-12 ${errors.role ? 'border-destructive' : ''}`}>
            <SelectValue placeholder="Selecione o tipo de conta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="creator">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-success" />
                <span>Criador - Monetize seus status</span>
              </div>
            </SelectItem>
            <SelectItem value="advertiser">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Anunciante - Encontre criadores</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.role && <p className="text-xs text-destructive">{errors.role}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>País</Label>
          <Select value={country} onValueChange={(code) => setCountry(code)}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione seu país" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Província/Estado</Label>
          <Select value={province} onValueChange={setProvince}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione sua província/estado" />
            </SelectTrigger>
            <SelectContent>
              {getProvinces(country).map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="seu@email.com"
          value={signupData.email || ''}
          onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value || undefined }))}
          className={`h-12 ${errors.email ? 'border-destructive' : ''}`}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Senha</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={onShowPassword ? "text" : "password"}
            placeholder="Mín. 6 chars, 1 maiúscula, 1 número"
            value={signupData.password}
            onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
            className={`h-12 pr-12 ${errors.password ? 'border-destructive' : ''}`}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={onTogglePassword}
          >
            {onShowPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <Button type="submit" className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold" disabled={loading}>
        {loading ? "Cadastrando..." : "Criar Conta"}
      </Button>
    </form>
  );
};

interface ResetPasswordFormProps {
  onBack: () => void;
}

export const ResetPasswordForm = ({ onBack }: ResetPasswordFormProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = resetPasswordSchema.safeParse({ email });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        setSent(true);
        toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada." });
      }
    } catch {
      toast({ title: "Erro inesperado", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
          <Star className="h-8 w-8 text-success" />
        </div>
        <h3 className="text-lg font-semibold">Email enviado!</h3>
        <p className="text-sm text-muted-foreground">
          Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
        </p>
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleReset} className="space-y-4">
      <div className="text-center mb-2">
        <h3 className="text-lg font-semibold">Esqueceu sua senha?</h3>
        <p className="text-sm text-muted-foreground">Digite seu email para receber um link de redefinição.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`h-12 ${errors.email ? 'border-destructive' : ''}`}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>
      <Button type="submit" className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold" disabled={loading}>
        {loading ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
      <Button type="button" variant="ghost" className="w-full gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> Voltar ao login
      </Button>
    </form>
  );
};
